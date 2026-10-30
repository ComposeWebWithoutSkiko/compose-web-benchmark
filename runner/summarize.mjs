// Turns results files of run.mjs or safari.mjs into Markdown tables. Several files, e.g. of runs of
// different suites, are combined; the machine and browser are those of the first.
//
//   node runner/summarize.mjs results/<time>.json...

import { readFile } from 'node:fs/promises';

const files = await Promise.all(process.argv.slice(2).map(async (file) => JSON.parse(await readFile(file, 'utf8'))));
const all = {
    startup: files.flatMap((file) => file.startup),
    runtime: files.flatMap((file) => file.runtime),
};
/** The measurements that failed (safari.mjs records them), which the tables leave out. */
const failures = [...all.startup, ...all.runtime].filter((entry) => entry.failed);
const results = {
    ...files[0],
    startup: all.startup.filter((entry) => !entry.failed),
    runtime: all.runtime.filter((entry) => !entry.failed),
    i18n: files.flatMap((file) => file.i18n),
};
const builds = ['upstream', 'webcanvas'];
const targets = [...new Set([...results.startup, ...results.runtime].map((entry) => entry.target))];

function quantile(values, q) {
    if (values.length === 0) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const position = (sorted.length - 1) * q;
    const low = Math.floor(position);
    const high = Math.ceil(position);
    return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
const median = (values) => quantile(values, 0.5);
const mean = (values) => (values.length === 0 ? NaN : values.reduce((sum, value) => sum + value, 0) / values.length);
const ms = (value) => (Number.isNaN(value) ? '–' : `${value.toFixed(value < 10 ? 2 : 0)} ms`);
const kib = (bytes) => `${(bytes / 1024).toFixed(0)} KiB`;
const ratio = (upstream, ours) => `${(upstream / ours).toFixed(1)}×`;
const table = (header, rows) => [
    `| ${header.join(' | ')} |`,
    `|${header.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
].join('\n');

const lines = [];
lines.push(`${results.browser} on ${results.machine.cpu} (${results.machine.cores} cores, ${results.machine.memoryGb} GB), ${results.machine.os}; GPU: ${results.gpu}.`);
lines.push(`Viewport ${results.viewport.width}×${results.viewport.height} CSS px at ${results.viewport.deviceScaleFactor}×. ${results.date}.`);

/** What the startup screen downloads: the app's own files, as the server sends them (brotli). */
const sameOrigin = (entry) => entry.url.startsWith('http://127.0.0.1');
const downloads = (entry) => {
    const own = entry.resources.filter(sameOrigin);
    return {
        compressed: own.reduce((sum, resource) => sum + resource.encodedBodySize, 0),
        raw: own.reduce((sum, resource) => sum + resource.decodedBodySize, 0),
        external: entry.resources.filter((resource) => !sameOrigin(resource)),
    };
};

if (results.startup.length) {
    // safari.mjs measures no download sizes.
    const rows = [];
    for (const target of targets) {
        const sizes = {};
        for (const build of builds) {
            const cold = results.startup.find((entry) => entry.build === build && entry.target === target && entry.kind === 'cold');
            if (cold?.resources) sizes[build] = downloads(cold);
        }
        if (!sizes.upstream || !sizes.webcanvas) continue;
        rows.push([target, `${kib(sizes.upstream.compressed)} (${kib(sizes.upstream.raw)} raw)`, `${kib(sizes.webcanvas.compressed)} (${kib(sizes.webcanvas.raw)} raw)`, ratio(sizes.upstream.compressed, sizes.webcanvas.compressed)]);
    }
    if (rows.length) {
        lines.push('', '### Download size of the startup screen', '');
        lines.push(table(['target', 'upstream (brotli)', 'Canvas 2D (brotli)', 'smaller by'], rows));
    }

    lines.push('', '### Time to the first frame (median)', '');
    const kinds = [
        ['cold', 'first visit'],
        ['warm', 'repeat visit (HTTP and code caches)'],
        ['throttled', 'first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT'],
    ];
    const startupRows = [];
    for (const target of targets) {
        for (const [kind, label] of kinds) {
            const times = (build) => results.startup
                .filter((entry) => entry.build === build && entry.target === target && entry.kind === kind)
                .map((entry) => entry.firstFrame);
            const upstream = times('upstream');
            const ours = times('webcanvas');
            if (!upstream.length || !ours.length) continue;
            startupRows.push([target, label, `${ms(median(upstream))} (n=${upstream.length})`, `${ms(median(ours))} (n=${ours.length})`, ratio(median(upstream), median(ours))]);
        }
    }
    lines.push(table(['target', 'load', 'upstream', 'Canvas 2D', 'faster by'], startupRows));
}

if (results.runtime.length) {
    // Results of run.mjs before it recorded the frame rate are of an uncapped one.
    lines.push('', `### Animated scenarios (frame rate ${results.frameRate ?? 'uncapped'}; median of runs)`, '');
    const rows = [];
    const scenarios = [...new Set(results.runtime.map((entry) => entry.scenario))];
    for (const target of targets) {
        for (const scenario of scenarios) {
            const stats = {};
            for (const build of builds) {
                const runs = results.runtime.filter((entry) => entry.build === build && entry.target === target && entry.scenario === scenario);
                if (!runs.length) continue;
                const work = runs.flatMap((entry) => entry.frameWorkMs);
                const cpu = (entry) => ((entry.cpuSecondsByProcessType.renderer ?? 0) + (entry.cpuSecondsByProcessType.GPU ?? 0)) * 1000 / entry.frames;
                // safari.mjs measures no heap.
                const heaps = runs.filter((entry) => entry.heap).map((entry) => entry.heap.usedSize + (entry.heap.backingStorageSize ?? 0));
                stats[build] = {
                    fps: median(runs.map((entry) => entry.frames / entry.seconds)),
                    workMean: mean(work),
                    workMedian: median(work),
                    workP95: quantile(work, 0.95),
                    cpuPerFrame: median(runs.map(cpu)),
                    heap: median(heaps),
                };
            }
            if (!stats.upstream || !stats.webcanvas) continue;
            const { upstream: u, webcanvas: w } = stats;
            const mib = (bytes) => (Number.isNaN(bytes) ? '–' : `${(bytes / 2 ** 20).toFixed(0)} MiB`);
            rows.push([
                target, scenario,
                `${u.fps.toFixed(0)} → **${w.fps.toFixed(0)}**`,
                `${ms(u.workMean)} / ${ms(u.workMedian)} / ${ms(u.workP95)} → **${ms(w.workMean)} / ${ms(w.workMedian)} / ${ms(w.workP95)}**`,
                `${ms(u.cpuPerFrame)} → **${ms(w.cpuPerFrame)}**`,
                `${mib(u.heap)} → **${mib(w.heap)}**`,
            ]);
        }
    }
    lines.push(table(['target', 'scenario', 'frames/s', 'main thread per frame (mean / median / p95)', 'CPU per frame (page + GPU process)', 'JS heap + buffers'], rows));
}

/** What went wrong in the page of [entry] (safari.mjs records it), for a table cell. */
const problems = (entry) => [...new Set([...(entry.errors ?? []), ...(entry.console ?? [])])].join('; ').replaceAll('|', '\\|');
const measurementOf = (entry) => entry.scenario ?? `startup (${entry.kind})`;

if (failures.length) {
    lines.push('', '### Failed measurements', '');
    lines.push(table(
        ['target', 'build', 'measurement', 'failure', 'errors and console'],
        failures.map((entry) => [entry.target, entry.build, measurementOf(entry), entry.failed, problems(entry) || '–']),
    ));
}

const withProblems = new Map();
for (const entry of [...results.startup, ...results.runtime]) {
    const text = problems(entry);
    if (!text) continue;
    const key = [entry.target, entry.build, measurementOf(entry)];
    const counted = withProblems.get(key.join('\n')) ?? { key, text, runs: 0 };
    counted.runs++;
    withProblems.set(key.join('\n'), counted);
}
if (withProblems.size) {
    lines.push('', '### Errors and warnings of the measured pages', '');
    lines.push(table(
        ['target', 'build', 'measurement', 'runs', 'errors and console'],
        [...withProblems.values()].map(({ key, text, runs }) => [...key, runs, text]),
    ));
}

if (results.i18n.length) {
    lines.push('', '### Text in 11 scripts with emoji (first visit, 10 s)', '');
    const bytes = (requests) => requests.reduce((sum, request) => sum + request.bytes, 0);
    const rows = [];
    for (const target of targets) {
        for (const build of builds) {
            const runs = results.i18n.filter((entry) => entry.build === build && entry.target === target && entry.network);
            if (!runs.length) continue;
            const external = runs.map((entry) => entry.network.filter((request) => !sameOrigin(request)));
            const lastFont = median(external.map((requests) => requests.reduce((last, request) => Math.max(last, request.end ?? 0), 0)));
            rows.push([
                target, build,
                `${ms(median(runs.map((entry) => entry.firstFrame)))} (n=${runs.length})`,
                kib(median(runs.map((entry) => bytes(entry.network.filter(sameOrigin))))),
                `${median(external.map((requests) => requests.length))} files, ${kib(median(external.map(bytes)))}${lastFont ? `, the last at ${ms(lastFont)}` : ''}`,
            ]);
        }
    }
    lines.push(table(['target', 'build', 'first frame (median)', 'app download', 'fonts downloaded (median)'], rows));
}

console.log(lines.join('\n'));
