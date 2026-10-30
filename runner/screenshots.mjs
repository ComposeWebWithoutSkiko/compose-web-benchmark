// Saves a screenshot of every scenario of every build to results/screenshots/, to check that the
// builds draw the same.
//
//   node runner/screenshots.mjs [--targets wasmJs,js]

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { launchChrome } from './chrome.mjs';
import { projectDir, startServer } from './server.mjs';

const { values: options } = parseArgs({
    options: {
        targets: { type: 'string', default: 'wasmJs,js' },
        scenarios: {
            type: 'string',
            default: 'startup,i18n,layers,fade,churn,filters,blur,nested,perspective,elevation,shadows,cutshadows,cardscroll,blend,canvas,text,effects',
        },
    },
});
const scenarios = options.scenarios.split(',');
const builds = ['upstream', 'webcanvas'];

const server = await startServer();
const chrome = await launchChrome();
const dir = join(projectDir, 'results', 'screenshots');
await mkdir(dir, { recursive: true });
try {
    for (const target of options.targets.split(',')) {
        for (const scenario of scenarios) {
            for (const build of builds) {
                const page = await chrome.openPage();
                await page.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false });
                await page.send('Page.navigate', { url: `${server.origin}/${build}/${target}/index.html?scenario=${scenario}` });
                await page.waitFor('globalThis.__bench?.firstFrame');
                // Fonts downloaded on demand get time to arrive.
                await sleep(scenario === 'i18n' ? 8000 : 1000);
                const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
                const file = join(dir, `${scenario}-${build}-${target}.png`);
                await writeFile(file, Buffer.from(data, 'base64'));
                console.log(file);
                await page.close();
            }
        }
    }
} finally {
    await chrome.close();
    server.close();
}
