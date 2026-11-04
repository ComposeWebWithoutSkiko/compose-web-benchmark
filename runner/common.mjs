// What the runners of the benchmark share: the apps and their animated scenarios, the viewport, the
// timings, the order of the builds, the log, the machine and the results files.

import { mkdir, writeFile } from 'node:fs/promises';
import { arch, cpus, release, totalmem } from 'node:os';
import { join } from 'node:path';
import { projectDir } from './server.mjs';

/** The animated scenarios of the benchmark's app, in the order they're measured (see the README). */
export const animatedScenarioNames = [
    'scroll', 'layers', 'fade', 'churn', 'filters', 'imagebrush', 'gradientbrush', 'compositebrush', 'softlight',
    'newcontent', 'blur', 'nested', 'perspective', 'elevation', 'shadows', 'cutshadows', 'cardscroll', 'cardlist',
    'blend', 'softlightlayers', 'canvas', 'text', 'effects',
];

/**
 * The apps the runners measure, by the name `--app` takes, the benchmark's own under `undefined`: the
 * animated scenarios of each, in the order they're measured, and whether it has the text in many
 * scripts (`i18n`). An app draws its own screen for a scenario it doesn't have, so the runners take
 * the pages they load by default from here.
 */
const apps = new Map([
    [undefined, { animatedScenarios: animatedScenarioNames, i18n: true }],
    ['haze', { animatedScenarios: ['panels', 'panel'], i18n: false }],
]);

/** The app that [name] names (see [apps]). */
export function appOf(name) {
    const app = apps.get(name);
    if (app === undefined) throw new Error(`Unknown app ${name}`);
    return app;
}

/** A laptop screen: 1280x800 CSS pixels at 2 device pixels per CSS pixel. */
export const viewport = { width: 1280, height: 800, deviceScaleFactor: 2 };

/** How long an animated scenario runs before its frames are measured. */
export const warmupMs = 3000;

/** How long the frames of an animated scenario are measured. */
export const measureMs = 5000;

export function log(message) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
}

/**
 * The path of the page of [scenario] in the [target] build of [build], of the benchmark's app or of
 * another [app], built to build/<build>-<app>.
 */
export function scenarioPath(build, target, scenario, app = undefined) {
    const directory = app ? `${build}-${app}` : build;
    return `/${directory}/${target}/index.html?scenario=${scenario}`;
}

/** [builds] in the order of repetition [run]: alternating, so neither always goes first. */
export const buildsOf = (builds, run) => (run % 2 === 0 ? builds : [...builds].reverse());

/** The machine the runner runs on, as the results record it. */
export function machine() {
    return { cpu: cpus()[0].model, cores: cpus().length, memoryGb: Math.round(totalmem() / 2 ** 30), os: `${process.platform} ${release()} ${arch()}` };
}

/**
 * The file in results/ of [results], named after their date and [suffix], and a function that saves
 * them to it.
 */
export async function resultsFile(results, suffix = '') {
    await mkdir(join(projectDir, 'results'), { recursive: true });
    const file = join(projectDir, 'results', `${results.date.replace(/[:.]/g, '-')}${suffix}.json`);
    return { file, save: () => writeFile(file, JSON.stringify(results, null, 2)) };
}
