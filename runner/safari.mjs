// Runs the benchmark in Safari and writes the raw results to results/<time>-safari.json, in the format
// of run.mjs. Safari has no DevTools protocol to drive it, so the runner opens every page in a window
// of its own in the running Safari through AppleScript, and the page measures itself (index.html)
// and posts what it measured to the server. What differs from run.mjs:
// - Safari draws at the refresh rate of the display, so the frame rate of a scenario is capped, and
//   its main thread and CPU time per frame are what compare the builds;
// - the CPU time of a frame is that of the busiest WebKit page process and the busiest WebKit GPU
//   process while the frames are measured, from `ps` (their ids are in the results);
// - a first visit loads the app from a path of its own (/v/<visit>/...), which Safari hasn't
//   cached, since its cache can't be cleared for a visit; the window has the viewport of run.mjs at
//   the pixel density of the display;
// - no throttled loads, no download sizes, no heap, no text in many scripts.
//
//   node runner/safari.mjs [--suites startup,runtime] [--builds upstream,webcanvas]
//                          [--targets wasmJs,js] [--runs 10] [--scenarios scroll,...]
//
// Safari draws nothing in a window that is hidden, e.g. behind the window of another app: while a
// page is hidden, the runner waits for it to be shown, and measures it again. It brings Safari to
// the front once, when it starts, and never again, so as not to take the keyboard from other apps.

import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import {
    animatedScenarioNames, buildsOf, log, machine, measureMs, resultsFile, scenarioPath, viewport, warmupMs,
} from './common.mjs';
import { parseCpuTime } from './ps.mjs';
import { startServer } from './server.mjs';

const { values: options } = parseArgs({
    options: {
        suites: { type: 'string', default: 'startup,runtime' },
        builds: { type: 'string', default: 'upstream,webcanvas' },
        targets: { type: 'string', default: 'wasmJs,js' },
        runs: { type: 'string', default: '10' },
        scenarios: { type: 'string', default: animatedScenarioNames.join(',') },
    },
});
const suites = options.suites.split(',');
const builds = options.builds.split(',');
const targets = options.targets.split(',');
const runs = Number(options.runs);
const animatedScenarios = options.scenarios.split(',');

/** How long a page that isn't hidden may take to report what it measured. */
const reportTimeoutMs = 120_000;

function appleScript(script) {
    return execFileSync('osascript', ['-e', script], { encoding: 'utf8' }).trim();
}

/** The windows of Safari the runner has open, by id. */
const openWindows = new Set();

/** Opens [url] in a new window of Safari, [size] points large, and returns the id of the window. */
function openWindow(url, size) {
    const id = appleScript(`tell application "Safari"
        make new document
        set w to front window
        set bounds of w to {40, 60, ${40 + size.width}, ${60 + size.height}}
        set URL of current tab of w to "${url}"
        return id of w
    end tell`);
    openWindows.add(id);
    return id;
}

function closeWindow(id) {
    openWindows.delete(id);
    appleScript(`tell application "Safari" to close (every window whose id is ${id})`);
}

process.on('SIGINT', () => {
    for (const id of openWindows) closeWindow(id);
    process.exit(130);
});

/** The CPU time in seconds of every WebKit page process and GPU process, by process id. */
function webKitCpuTimes() {
    const times = new Map();
    for (const line of execFileSync('ps', ['-A', '-o', 'pid=,time=,comm='], { encoding: 'utf8' }).split('\n')) {
        const match = /^\s*(\d+)\s+(\S+)\s.*\/com\.apple\.WebKit\.(WebContent|GPU)$/.exec(line);
        if (match) times.set(match[1], { type: match[3], seconds: parseCpuTime(match[2]) });
    }
    return times;
}

/** The busiest process of each type from [before] to [after]: its id and CPU seconds. */
function busiestProcesses(before, after) {
    const busiest = {};
    for (const [pid, { type, seconds }] of after) {
        const cpuSeconds = seconds - (before.get(pid)?.seconds ?? 0);
        if (!busiest[type] || cpuSeconds > busiest[type].cpuSeconds) busiest[type] = { pid, cpuSeconds };
    }
    return busiest;
}

/** The runs whose pages are open, by id. */
const openRuns = new Map();
let nextRun = 0;

const server = await startServer(0, {
    onRunEvent: async (run, event, data) => {
        const state = openRuns.get(run);
        if (!state) return;
        if (event === 'start') state.cpuBefore = webKitCpuTimes();
        else if (event === 'stop') state.cpuAfter = webKitCpuTimes();
        else if (event === 'error') state.errors.push(data.message);
        else if (event === 'console') state.console.push(data.message);
        else if (event === 'hidden') state.hide();
        else if (event === 'shown') state.show();
        else if (event === 'result') state.report(data);
    },
});

/** The size of Safari's windows: the viewport and the window around it. */
let windowSize = viewport;

/**
 * Opens the page [path] with the [parameters] of index.html in a window of its own and returns
 * what it reported (null if nothing in time), its uncaught errors, its first errors and warnings
 * logged to the console, and the busiest WebKit processes while it measured its frames. The window
 * stays open [lingerMs] longer. While the page is hidden (Safari is behind another app), the run
 * waits for it to be shown, and then measures it again.
 */
async function visit(path, parameters = '', { lingerMs = 0 } = {}) {
    for (;;) {
        const run = String(nextRun++);
        const state = { errors: [], console: [], cpuBefore: null, cpuAfter: null };
        const reported = new Promise((resolve) => { state.report = resolve; });
        const hidden = new Promise((resolve) => { state.hide = resolve; });
        const shown = new Promise((resolve) => { state.show = resolve; });
        openRuns.set(run, state);
        const timeout = new AbortController();
        const windowId = openWindow(`${server.origin}${path}#run=${run}${parameters}`, windowSize);
        let outcome;
        try {
            outcome = await Promise.race([
                reported.then((data) => ({ data })),
                hidden.then(() => ({ hidden: true })),
                sleep(reportTimeoutMs, { data: null }, { signal: timeout.signal }).catch(() => null),
            ]);
            if (outcome.hidden) {
                log(`${path}: Safari's window is hidden, waiting for it to be shown to measure it again`);
                await shown;
            } else if (outcome.data && lingerMs) {
                await sleep(lingerMs);
            }
        } finally {
            timeout.abort();
            openRuns.delete(run);
            closeWindow(windowId);
        }
        if (outcome.hidden) continue;
        return {
            data: outcome.data,
            errors: state.errors,
            console: state.console,
            processes: state.cpuBefore && state.cpuAfter ? busiestProcesses(state.cpuBefore, state.cpuAfter) : null,
        };
    }
}

/** A measurement whose page reported nothing in time, as the results record it. */
function failure(result) {
    return { failed: 'no report', errors: result.errors, console: result.console };
}

/** What the page of [result] reported as wrong, for the log. */
const problems = (result) => [...result.errors, ...result.console].join('; ');

/** The path of the startup screen of [build] for [target], as visit [visitId] loads it. */
const startupPath = (visitId, build, target) => `/v/${visitId}${scenarioPath(build, target, 'startup')}`;

/** A token of this invocation of the runner: the paths of its visits are new to Safari. */
const session = Date.now().toString(36);
let nextVisit = 0;

appleScript('tell application "Safari" to activate');

// The size of Safari's window around its viewport, from a page in a window of the viewport's size;
// the page loads the app the first time, which doesn't count.
const calibration = await visit(startupPath(`${session}-calibration`, builds[0], targets[0]), '&describe');
if (!calibration.data) throw new Error(`The calibration page failed: ${JSON.stringify(failure(calibration))}`);
const { windowChrome, userAgent, gpu } = calibration.data;
windowSize = { width: viewport.width + windowChrome.width, height: viewport.height + windowChrome.height };
const check = await visit(startupPath(`${session}-check`, builds[0], targets[0]));
if (!check.data) throw new Error(`The page failed: ${JSON.stringify(failure(check))}`);

const results = {
    date: new Date().toISOString(),
    machine: machine(),
    browser: `Safari/${/Version\/([\d.]+)/.exec(userAgent)?.[1] ?? userAgent}`,
    gpu,
    viewport: check.data.viewport,
    frameRate: 'capped by the display',
    throttling: null,
    warmupMs,
    measureMs,
    startup: [],
    runtime: [],
    i18n: [],
};
log(`${results.browser}, GPU: ${gpu}, viewport ${JSON.stringify(results.viewport)}`);
if (results.viewport.width !== viewport.width || results.viewport.height !== viewport.height) {
    log(`The viewport isn't ${viewport.width}x${viewport.height}: the screen may be too small for the window`);
}

const ms = (value) => `${value.toFixed(0)} ms`;

/** Saved after every scenario: a run that ends early, e.g. on a locked screen, keeps what it measured. */
const { file, save } = await resultsFile(results, '-safari');

try {
    if (suites.includes('startup')) {
        for (const target of targets) {
            // A repeat visit finds the app in Safari's caches: it is loaded twice before and left
            // running a while, as run.mjs does.
            for (const build of builds) {
                for (let i = 0; i < 2; i++) await visit(startupPath(`${session}-warm`, build, target), '', { lingerMs: 2000 });
            }
            for (let run = 0; run < runs; run++) {
                for (const build of buildsOf(builds, run)) {
                    const loads = {};
                    for (const kind of ['cold', 'warm']) {
                        const visitId = kind === 'cold' ? `${session}-${nextVisit++}` : `${session}-warm`;
                        const result = await visit(startupPath(visitId, build, target));
                        const entry = result.data
                            ? { firstDraw: result.data.firstDraw, firstFrame: result.data.firstFrame, errors: result.errors, console: result.console }
                            : failure(result);
                        results.startup.push({ build, target, kind, ...entry });
                        loads[kind] = `${result.data ? ms(result.data.firstFrame) : entry.failed} ${problems(result)}`.trim();
                    }
                    log(`startup ${target} ${build}: cold ${loads.cold}, warm ${loads.warm}`);
                }
            }
            await save();
        }
    }
    if (suites.includes('runtime')) {
        for (const target of targets) {
            for (const scenario of animatedScenarios) {
                for (let run = 0; run < 3; run++) {
                    for (const build of buildsOf(builds, run)) {
                        const result = await visit(scenarioPath(build, target, scenario), `&warmup=${warmupMs}&measure=${measureMs}`);
                        if (!result.data) {
                            results.runtime.push({ build, target, scenario, ...failure(result) });
                            log(`${scenario} ${target} ${build}: ${failure(result).failed} ${problems(result)}`);
                            continue;
                        }
                        const { seconds, frames, frameWorkMs } = result.data;
                        results.runtime.push({
                            build, target, scenario, seconds, frames, frameWorkMs,
                            cpuSecondsByProcessType: {
                                renderer: result.processes.WebContent?.cpuSeconds ?? 0,
                                GPU: result.processes.GPU?.cpuSeconds ?? 0,
                            },
                            processes: result.processes,
                            heap: null,
                            errors: result.errors,
                            console: result.console,
                        });
                        log(`${scenario} ${target} ${build}: ${(frames / seconds).toFixed(0)} fps ${problems(result)}`);
                    }
                }
                await save();
            }
        }
    }
} finally {
    server.close();
}

log(`Results: ${file}`);
