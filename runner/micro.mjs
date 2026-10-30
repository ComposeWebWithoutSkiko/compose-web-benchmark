// Runs a micro-benchmark page of micro/ with each of its variants and prints the frame rate, the
// main thread work per frame and the CPU time per frame of the page's and the GPU process.
//
//   node runner/micro.mjs <page> <variant>[,<variant>...] [--params extra=1] [--runs 3]

import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { launchChrome } from './chrome.mjs';
import { startServer } from './server.mjs';

const { values: options, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        params: { type: 'string', default: '' },
        runs: { type: 'string', default: '3' },
        warmup: { type: 'string', default: '2000' },
        measure: { type: 'string', default: '4000' },
    },
});
const [page, variantList] = positionals;
const variants = variantList.split(',');
const runs = Number(options.runs);

const server = await startServer();
const chrome = await launchChrome({ extraArguments: ['--disable-frame-rate-limit', '--disable-gpu-vsync'] });

const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

async function measure(variant) {
    const tab = await chrome.openPage();
    try {
        await tab.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false });
        const extra = options.params ? `&${options.params}` : '';
        await tab.send('Page.navigate', { url: `${server.origin}/micro/${page}?variant=${variant}${extra}` });
        await tab.waitFor('globalThis.__bench?.firstFrame');
        await sleep(Number(options.warmup));
        const cpuBefore = (await chrome.send('SystemInfo.getProcessInfo')).processInfo;
        const before = await tab.evaluate('(__bench.frameWork = [], { time: performance.now(), frames: __bench.frames })');
        await sleep(Number(options.measure));
        const after = await tab.evaluate('({ time: performance.now(), frames: __bench.frames, work: __bench.frameWork })');
        const cpuAfter = (await chrome.send('SystemInfo.getProcessInfo')).processInfo;
        const cpu = {};
        for (const process of cpuAfter) {
            const previous = cpuBefore.find((entry) => entry.id === process.id);
            cpu[process.type] = (cpu[process.type] ?? 0) + process.cpuTime - (previous?.cpuTime ?? 0);
        }
        const frames = after.frames - before.frames;
        return {
            fps: frames / ((after.time - before.time) / 1000),
            mainMs: median(after.work),
            rendererMs: (cpu.renderer ?? 0) * 1000 / frames,
            gpuMs: (cpu.GPU ?? 0) * 1000 / frames,
        };
    } finally {
        await tab.close();
    }
}

try {
    const results = Object.fromEntries(variants.map((variant) => [variant, []]));
    for (let run = 0; run < runs; run++) {
        for (const variant of run % 2 === 0 ? variants : [...variants].reverse()) {
            results[variant].push(await measure(variant));
        }
    }
    console.log(`| variant | frames/s | main thread per frame | page CPU per frame | GPU CPU per frame |`);
    console.log(`|---|---|---|---|---|`);
    for (const [variant, list] of Object.entries(results)) {
        const m = (key) => median(list.map((entry) => entry[key]));
        console.log(`| ${variant} | ${m('fps').toFixed(0)} | ${m('mainMs').toFixed(2)} ms | ${m('rendererMs').toFixed(2)} ms | ${m('gpuMs').toFixed(2)} ms |`);
    }
} finally {
    await chrome.close();
    server.close();
}
