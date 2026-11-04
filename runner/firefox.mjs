// Runs the animated scenarios in Firefox and writes the raw results to results/<time>-firefox.json, in
// the format of run.mjs. It drives a Firefox of its own, with a throwaway profile, through WebDriver
// BiDi, and reads the probes of the page as run.mjs does. What differs from run.mjs:
// - Firefox draws at a fixed frame rate (`layout.frame_rate`, --frame-rate), so the frame rate of a
//   scenario is capped, and its main thread and CPU time per frame are what compare the builds when
//   both reach it;
// - the CPU time of a frame is that of the tab processes and the GPU process of that Firefox while the
//   frames are measured, from `ps`;
// - Firefox's other prefs are its own, its timer included (`privacy.reduceTimerPrecision`), so that
//   the builds run as they would for a user; the results record the prefs the profile sets;
// - no startup, no throttled loads, no heap, no text in many scripts.
//
//   node runner/firefox.mjs [--builds upstream,webcanvas] [--targets wasmJs,js]
//                           [--scenarios scroll,...] [--frame-rate 120] [--app haze]
//
// Firefox on macOS hides the documents of a window that other windows cover, and they draw nothing
// (nsCocoaWindow::DispatchOcclusionEvent): a page hidden while its frames are measured is measured
// again once it is shown.

import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import {
    appOf, buildsOf, log, machine, measureMs, resultsFile, scenarioPath, viewport, warmupMs,
} from './common.mjs';
import { frameCount, gpuName, startFrameWork, takeFrameWork } from './probes.mjs';
import { parseCpuTime } from './ps.mjs';
import { startServer } from './server.mjs';

const { values: options } = parseArgs({
    options: {
        builds: { type: 'string', default: 'upstream,webcanvas' },
        targets: { type: 'string', default: 'wasmJs,js' },
        // The animated scenarios of the app, all of them by default.
        scenarios: { type: 'string' },
        'frame-rate': { type: 'string', default: '120' },
        // An app other than the benchmark's, built to build/<build>-<app>.
        app: { type: 'string' },
    },
});
const app = appOf(options.app);
const builds = options.builds.split(',');
const targets = options.targets.split(',');
const animatedScenarios = options.scenarios?.split(',') ?? app.animatedScenarios;

const firefoxPath = '/Applications/Firefox.app/Contents/MacOS/firefox';

/**
 * The prefs the profile sets: the frame rate, and what keeps a new profile from opening the pages
 * and prompts of a first run and from updating Firefox while it measures.
 */
const prefs = {
    'layout.frame_rate': Number(options['frame-rate']),
    'browser.shell.checkDefaultBrowser': false,
    'browser.aboutwelcome.enabled': false,
    'browser.startup.homepage_override.mstone': 'ignore',
    'datareporting.policy.dataSubmissionEnabled': false,
    'app.update.disabledForTesting': true,
};

/** Launches Firefox with a new profile of [prefs] and returns a WebDriver BiDi session with it. */
async function launchFirefox() {
    const profile = await mkdtemp(join(tmpdir(), 'compose-web-benchmark-'));
    await writeFile(
        join(profile, 'user.js'),
        Object.entries(prefs).map(([name, value]) => `user_pref(${JSON.stringify(name)}, ${JSON.stringify(value)});`).join('\n'),
    );
    const firefox = spawn(firefoxPath, [
        '--profile', profile, '--no-remote', '--new-instance', '--remote-debugging-port=0', 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    try {
        return await connect(firefox, profile);
    } catch (error) {
        firefox.kill();
        await rm(profile, { recursive: true, force: true });
        throw error;
    }
}

/** Opens a WebDriver BiDi session with [firefox], launched with [profile], once it listens. */
async function connect(firefox, profile) {
    const endpoint = await new Promise((resolve, reject) => {
        let output = '';
        const onOutput = (data) => {
            output += data;
            const listening = /WebDriver BiDi listening on (ws:\/\/\S+)/.exec(output);
            if (!listening) return;
            // What Firefox prints after is dropped.
            firefox.stderr.off('data', onOutput);
            resolve(listening[1]);
        };
        firefox.stderr.on('data', onOutput);
        firefox.once('exit', () => reject(new Error(`Firefox exited: ${output}`)));
    });
    const socket = new WebSocket(`${endpoint}/session`);
    await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = () => reject(new Error(`Could not connect to ${endpoint}`));
    });
    let nextId = 1;
    const pending = new Map();
    socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        const command = pending.get(message.id);
        // Events answer no command.
        if (!command) return;
        pending.delete(message.id);
        if (message.type === 'error') command.reject(new Error(`${command.method}: ${message.error}: ${message.message}`));
        else command.resolve(message.result);
    };
    // Firefox gone, no command will be answered.
    socket.onclose = () => {
        for (const command of pending.values()) command.reject(new Error(`${command.method}: Firefox closed the connection`));
        pending.clear();
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        if (socket.readyState !== WebSocket.OPEN) {
            reject(new Error(`${method}: Firefox closed the connection`));
            return;
        }
        const id = nextId++;
        pending.set(id, { resolve, reject, method });
        socket.send(JSON.stringify({ id, method, params }));
    });
    const { capabilities } = await send('session.new', { capabilities: {} });
    return {
        send,
        pid: firefox.pid,
        version: `Firefox/${capabilities.browserVersion}`,
        async close() {
            if (firefox.exitCode === null && firefox.signalCode === null) {
                const exited = new Promise((resolve) => firefox.once('exit', resolve));
                await send('browser.close').catch(() => firefox.kill());
                await exited;
            }
            await rm(profile, { recursive: true, force: true });
        },
    };
}

/** The CPU seconds of the tab processes and of the GPU process of the Firefox the runner launched. */
function firefoxCpuSeconds() {
    const seconds = { tab: 0, gpu: 0 };
    for (const line of execFileSync('ps', ['-A', '-o', 'ppid=,time=,command='], { encoding: 'utf8' }).split('\n')) {
        const [ppid, time, ...command] = line.trim().split(/\s+/);
        // A child process of Firefox has its type as its last argument.
        const type = command.at(-1);
        if (Number(ppid) === firefox.pid && Object.hasOwn(seconds, type)) seconds[type] += parseCpuTime(time);
    }
    return seconds;
}

const server = await startServer();
const firefox = await launchFirefox();

/** Evaluates [expression] in the page of [context] and returns its value, carried as JSON. */
async function evaluate(context, expression) {
    const evaluated = await firefox.send('script.evaluate', {
        expression: `JSON.stringify(${expression})`,
        target: { context },
        awaitPromise: true,
    });
    if (evaluated.type === 'exception') throw new Error(`${expression}: ${evaluated.exceptionDetails.text}`);
    const { value } = evaluated.result;
    return value === undefined ? undefined : JSON.parse(value);
}

/** Polls [expression] in the page of [context] until it is neither null nor undefined. */
async function waitFor(context, expression, { timeoutMs = 60_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const value = await evaluate(context, expression);
        if (value !== null && value !== undefined) return value;
        await sleep(25);
    }
    throw new Error(`Timed out waiting for ${expression}`);
}

/** Sets `__bench.wasHidden` whenever the page gets hidden. */
const watchHidden = `document.addEventListener('visibilitychange', () => { __bench.wasHidden ||= document.hidden; })`;

/** Measures the frames of the page of [context], or returns null if the page was hidden meanwhile. */
async function measureFrames(context) {
    await evaluate(context, '__bench.wasHidden = document.hidden');
    await evaluate(context, startFrameWork);
    const before = await evaluate(context, frameCount);
    const cpuBefore = firefoxCpuSeconds();
    await sleep(measureMs);
    const after = await evaluate(context, frameCount);
    const cpuAfter = firefoxCpuSeconds();
    const frameWorkMs = await evaluate(context, takeFrameWork);
    if (await evaluate(context, '__bench.wasHidden')) return null;
    return {
        seconds: (after.time - before.time) / 1000,
        frames: after.frames - before.frames,
        frameWorkMs,
        // The process types of run.mjs.
        cpuSecondsByProcessType: { renderer: cpuAfter.tab - cpuBefore.tab, GPU: cpuAfter.gpu - cpuBefore.gpu },
    };
}

/** Runs an animated scenario in a tab of its own and measures the work of its frames. */
async function measureRuntime(build, target, scenario) {
    const { context } = await firefox.send('browsingContext.create', { type: 'tab' });
    try {
        await firefox.send('browsingContext.setViewport', {
            context,
            viewport: { width: viewport.width, height: viewport.height },
            devicePixelRatio: viewport.deviceScaleFactor,
        });
        await firefox.send('browsingContext.navigate', {
            context,
            url: server.origin + scenarioPath(build, target, scenario, options.app),
            wait: 'complete',
        });
        await waitFor(context, 'globalThis.__bench?.firstFrame');
        await evaluate(context, watchHidden);
        await sleep(warmupMs);
        for (;;) {
            const frames = await measureFrames(context);
            if (frames) return { build, target, scenario, ...frames, heap: null };
            log(`${scenario} ${target} ${build}: Firefox's window is hidden, waiting for it to be shown to measure it again`);
            await waitFor(context, 'document.hidden ? null : true', { timeoutMs: Infinity });
        }
    } finally {
        await firefox.send('browsingContext.close', { context });
    }
}

const { contexts: [firstTab] } = await firefox.send('browsingContext.getTree');
const results = {
    date: new Date().toISOString(),
    machine: machine(),
    browser: firefox.version,
    gpu: await evaluate(firstTab.context, gpuName),
    prefs,
    viewport,
    frameRate: prefs['layout.frame_rate'],
    throttling: null,
    warmupMs,
    measureMs,
    startup: [],
    runtime: [],
    i18n: [],
};
log(`${results.browser}, GPU: ${results.gpu}, ${results.frameRate} frames per second at most`);

/** Saved after every scenario: a run that ends early keeps what it measured. */
const { file, save } = await resultsFile(results, '-firefox');

try {
    for (const target of targets) {
        for (const scenario of animatedScenarios) {
            for (let run = 0; run < 3; run++) {
                for (const build of buildsOf(builds, run)) {
                    const result = await measureRuntime(build, target, scenario);
                    results.runtime.push(result);
                    const perFrame = (type) => (result.cpuSecondsByProcessType[type] * 1000 / result.frames).toFixed(2);
                    log(`${scenario} ${target} ${build}: ${(result.frames / result.seconds).toFixed(0)} fps, ` +
                        `${perFrame('renderer')} ms in the tabs and ${perFrame('GPU')} ms in the GPU process per frame`);
                }
            }
            await save();
        }
    }
} finally {
    await firefox.close();
    server.close();
}

log(`Results: ${file}`);
