// Runs the benchmark in Chrome and writes the raw results to results/<time>.json.
//
//   node runner/run.mjs [--suites startup,throttled,runtime,i18n] [--builds upstream,webcanvas]
//                       [--targets wasmJs,js] [--runs 10] [--headed] [--app haze]
//
// The builds alternate within every repetition, so that a change of the machine's state (heat,
// background work) affects both alike.

import { mkdir, writeFile } from 'node:fs/promises';
import { arch, cpus, release, totalmem } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { launchChrome } from './chrome.mjs';
import { projectDir, startServer } from './server.mjs';

const { values: options } = parseArgs({
    options: {
        suites: { type: 'string', default: 'startup,throttled,runtime,i18n' },
        builds: { type: 'string', default: 'upstream,webcanvas' },
        targets: { type: 'string', default: 'wasmJs,js' },
        runs: { type: 'string', default: '10' },
        scenarios: {
            type: 'string',
            default: 'scroll,layers,fade,churn,filters,blur,nested,perspective,elevation,shadows,cutshadows,cardscroll,blend,canvas,text,effects',
        },
        headed: { type: 'boolean', default: false },
        // An app other than the benchmark's, built to build/<build>-<app>.
        app: { type: 'string' },
    },
});
const suites = options.suites.split(',');
const builds = options.builds.split(',');
const targets = options.targets.split(',');
const runs = Number(options.runs);

/** A laptop screen: 1280x800 CSS pixels at 2 device pixels per CSS pixel. */
const viewport = { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false };

/** A mid-range phone on mobile internet: a 4x slower CPU, 10 Mbit/s down, 2 Mbit/s up, 100 ms RTT. */
const throttling = { cpuRate: 4, latency: 100, downloadThroughput: 10e6 / 8, uploadThroughput: 2e6 / 8 };

const animatedScenarios = options.scenarios.split(',');
const warmupMs = 3000;
const measureMs = 5000;

const server = await startServer();
// Uncapped frames: the frame rate of an animated scenario is then the throughput of the
// pipeline, not the refresh rate of the display.
const chrome = await launchChrome({
    headless: !options.headed,
    extraArguments: ['--disable-frame-rate-limit', '--disable-gpu-vsync'],
});

const results = {
    date: new Date().toISOString(),
    machine: { cpu: cpus()[0].model, cores: cpus().length, memoryGb: Math.round(totalmem() / 2 ** 30), os: `${process.platform} ${release()} ${arch()}` },
    browser: (await chrome.send('Browser.getVersion')).product,
    gpu: null,
    viewport,
    frameRate: 'uncapped',
    throttling,
    warmupMs,
    measureMs,
    startup: [],
    runtime: [],
    i18n: [],
};

function urlOf(build, target, scenario) {
    const directory = options.app ? `${build}-${options.app}` : build;
    return `${server.origin}/${directory}/${target}/index.html?scenario=${scenario}`;
}

async function preparePage(page, { cacheDisabled = false, throttled = false } = {}) {
    await page.send('Emulation.setDeviceMetricsOverride', viewport);
    await page.send('Network.setCacheDisabled', { cacheDisabled });
    if (throttled) {
        await page.send('Emulation.setCPUThrottlingRate', { rate: throttling.cpuRate });
        await page.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: throttling.latency,
            downloadThroughput: throttling.downloadThroughput,
            uploadThroughput: throttling.uploadThroughput,
        });
    }
}

const loadTimings = `(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    return {
        firstDraw: __bench.firstDraw,
        firstFrame: __bench.firstFrame,
        firstContentfulPaint: paint ? paint.startTime : null,
        domContentLoaded: navigation.domContentLoadedEventEnd,
        resources: [navigation, ...performance.getEntriesByType('resource')].map((entry) => ({
            url: entry.name,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize,
            start: entry.startTime,
            end: entry.responseEnd,
        })),
    };
})()`;

/** Loads the startup screen and measures until its first frame. */
async function measureStartup(build, target, { cache, throttled = false }) {
    const page = await chrome.openPage({ contextId: cache?.contextId ?? null });
    try {
        await preparePage(page, { cacheDisabled: !cache, throttled });
        await page.send('Page.navigate', { url: urlOf(build, target, 'startup') });
        await page.waitFor('globalThis.__bench?.firstFrame', { timeoutMs: 120_000 });
        return await page.evaluate(loadTimings);
    } finally {
        await page.close();
    }
}

/** A browser context whose HTTP cache and compiled code cache hold the app. */
async function warmCache(build, target) {
    const { browserContextId: contextId } = await chrome.send('Target.createBrowserContext');
    const cache = { contextId };
    // V8 caches the compiled code of a wasm module once it has been loaded and optimized, so the
    // app is loaded twice and left running a while.
    for (let i = 0; i < 2; i++) {
        const page = await chrome.openPage({ contextId });
        await preparePage(page);
        await page.send('Page.navigate', { url: urlOf(build, target, 'startup') });
        await page.waitFor('globalThis.__bench?.firstFrame');
        await sleep(2000);
        await page.close();
    }
    return cache;
}

async function processTimes() {
    const { processInfo } = await chrome.send('SystemInfo.getProcessInfo');
    return processInfo;
}

const snapshot = `(() => ({ time: performance.now(), frames: __bench.frames }))()`;

/** Runs an animated scenario and measures the work of its frames. */
async function measureRuntime(build, target, scenario) {
    const page = await chrome.openPage();
    try {
        await preparePage(page);
        await page.send('Page.navigate', { url: urlOf(build, target, scenario) });
        await page.waitFor('globalThis.__bench?.firstFrame');
        await sleep(warmupMs);

        const metricsBefore = (await page.send('Performance.getMetrics')).metrics;
        const processesBefore = await processTimes();
        await page.evaluate('__bench.frameWork = []');
        const before = await page.evaluate(snapshot);
        await sleep(measureMs);
        const after = await page.evaluate(snapshot);
        const frameWork = await page.evaluate('(() => { const work = __bench.frameWork; __bench.frameWork = null; return work; })()');
        const processesAfter = await processTimes();
        const metricsAfter = (await page.send('Performance.getMetrics')).metrics;

        await page.send('HeapProfiler.collectGarbage');
        const heap = await page.send('Runtime.getHeapUsage');

        const metric = (metrics, name) => metrics.find((entry) => entry.name === name)?.value ?? 0;
        const cpuByType = {};
        for (const process of processesAfter) {
            const previous = processesBefore.find((entry) => entry.id === process.id);
            const delta = process.cpuTime - (previous?.cpuTime ?? 0);
            cpuByType[process.type] = (cpuByType[process.type] ?? 0) + delta;
        }
        return {
            build, target, scenario,
            seconds: (after.time - before.time) / 1000,
            frames: after.frames - before.frames,
            frameWorkMs: frameWork,
            mainThreadTaskSeconds: metric(metricsAfter, 'TaskDuration') - metric(metricsBefore, 'TaskDuration'),
            scriptSeconds: metric(metricsAfter, 'ScriptDuration') - metric(metricsBefore, 'ScriptDuration'),
            cpuSecondsByProcessType: cpuByType,
            heap,
        };
    } finally {
        await page.close();
    }
}

/**
 * Loads the text in many scripts and lists what the page downloads within 10 seconds, as the
 * network sees it: Resource Timing hides the sizes of other origins that don't allow it.
 */
async function measureI18n(build, target) {
    const page = await chrome.openPage();
    const requests = new Map();
    const listener = ({ method, params, sessionId }) => {
        if (sessionId !== page.sessionId) return;
        if (method === 'Network.requestWillBeSent') {
            requests.set(params.requestId, { url: params.request.url, start: params.timestamp, bytes: 0 });
        } else if (method === 'Network.loadingFinished' && requests.has(params.requestId)) {
            Object.assign(requests.get(params.requestId), { bytes: params.encodedDataLength, end: params.timestamp });
        }
    };
    chrome.listeners.add(listener);
    try {
        await preparePage(page, { cacheDisabled: true });
        await page.send('Page.navigate', { url: urlOf(build, target, 'i18n') });
        await page.waitFor('globalThis.__bench?.firstFrame');
        await sleep(10_000);
        const timings = await page.evaluate(loadTimings);
        const navigationStart = Math.min(...[...requests.values()].map((request) => request.start));
        timings.network = [...requests.values()].map((request) => ({
            url: request.url,
            bytes: request.bytes,
            end: request.end === undefined ? null : (request.end - navigationStart) * 1000,
        }));
        const screenshot = await page.send('Page.captureScreenshot', { format: 'png' });
        await mkdir(join(projectDir, 'results', 'screenshots'), { recursive: true });
        const file = join('results', 'screenshots', `i18n-${build}-${target}.png`);
        await writeFile(join(projectDir, file), Buffer.from(screenshot.data, 'base64'));
        return { build, target, ...timings, screenshot: file };
    } finally {
        chrome.listeners.delete(listener);
        await page.close();
    }
}

function log(message) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
}

{
    const page = await chrome.openPage();
    results.gpu = await page.evaluate(`(() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return 'no WebGL 2';
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    })()`);
    await page.close();
    log(`${results.browser}, GPU: ${results.gpu}`);
}

/** The builds in the order of repetition [run]: alternating, so neither always goes first. */
const buildsOf = (run) => (run % 2 === 0 ? builds : [...builds].reverse());

try {
    if (suites.includes('startup')) {
        for (const target of targets) {
            const caches = {};
            for (const build of builds) caches[build] = await warmCache(build, target);
            for (let run = 0; run < runs; run++) {
                for (const build of buildsOf(run)) {
                    const cold = await measureStartup(build, target, { cache: null });
                    const warm = await measureStartup(build, target, { cache: caches[build] });
                    results.startup.push({ build, target, kind: 'cold', ...cold }, { build, target, kind: 'warm', ...warm });
                    log(`startup ${target} ${build}: cold ${cold.firstFrame.toFixed(0)} ms, warm ${warm.firstFrame.toFixed(0)} ms`);
                }
            }
            for (const build of builds) await chrome.send('Target.disposeBrowserContext', { browserContextId: caches[build].contextId });
        }
    }
    if (suites.includes('throttled')) {
        for (const target of targets) {
            for (let run = 0; run < Math.ceil(runs / 2); run++) {
                for (const build of buildsOf(run)) {
                    const cold = await measureStartup(build, target, { cache: null, throttled: true });
                    results.startup.push({ build, target, kind: 'throttled', ...cold });
                    log(`throttled startup ${target} ${build}: ${cold.firstFrame.toFixed(0)} ms`);
                }
            }
        }
    }
    if (suites.includes('runtime')) {
        for (const target of targets) {
            for (const scenario of animatedScenarios) {
                for (let run = 0; run < 3; run++) {
                    for (const build of buildsOf(run)) {
                        const result = await measureRuntime(build, target, scenario);
                        results.runtime.push(result);
                        log(`${scenario} ${target} ${build}: ${(result.frames / result.seconds).toFixed(0)} fps`);
                    }
                }
            }
        }
    }
    if (suites.includes('i18n')) {
        // In a browser that has just started, the first load of these scripts takes seconds to its
        // first frame with either build (seen with Chrome 155 on macOS), so a load of each goes
        // first and isn't counted.
        for (const target of targets) {
            for (const build of builds) await measureI18n(build, target);
        }
        for (const target of targets) {
            for (let run = 0; run < 3; run++) {
                for (const build of buildsOf(run)) {
                    const result = await measureI18n(build, target);
                    results.i18n.push(result);
                    const bytes = result.network.reduce((sum, entry) => sum + entry.bytes, 0);
                    log(`i18n ${target} ${build}: first frame ${result.firstFrame.toFixed(0)} ms, ${(bytes / 1024).toFixed(0)} KiB downloaded`);
                }
            }
        }
    }
} finally {
    await chrome.close();
    server.close();
}

await mkdir(join(projectDir, 'results'), { recursive: true });
const file = join(projectDir, 'results', `${results.date.replace(/[:.]/g, '-')}.json`);
await writeFile(file, JSON.stringify(results, null, 2));
log(`Results: ${file}`);
