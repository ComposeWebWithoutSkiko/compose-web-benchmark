// Prints the sizes of the production builds: every file the app loads, raw, gzip -9 and brotli -11.
//
//   node runner/sizes.mjs [--json]

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { distDir } from './server.mjs';

const builds = ['upstream', 'webcanvas'];
const targets = ['wasmJs', 'js'];

/** Files a browser doesn't load: source maps, and the TypeScript and license files of webpack. */
const isLoaded = (name) => !/\.(map|d\.ts|LICENSE\.txt)$/.test(name);

async function sizesOf(dir) {
    const files = [];
    for (const name of (await readdir(dir)).sort()) {
        if (!isLoaded(name)) continue;
        const data = await readFile(join(dir, name)).catch(() => null);
        if (!data) continue;
        files.push({
            name,
            raw: data.length,
            gzip: gzipSync(data, { level: 9 }).length,
            brotli: brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
        });
    }
    const total = (key) => files.reduce((sum, file) => sum + file[key], 0);
    return { files, raw: total('raw'), gzip: total('gzip'), brotli: total('brotli') };
}

const result = {};
for (const build of builds) {
    for (const target of targets) {
        result[`${build}/${target}`] = await sizesOf(distDir(build, target)).catch(() => null);
    }
}

if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
} else {
    const kib = (bytes) => `${(bytes / 1024).toFixed(0)} KiB`;
    for (const [name, sizes] of Object.entries(result)) {
        if (!sizes) {
            console.log(`${name}: not built`);
            continue;
        }
        console.log(`${name}: ${kib(sizes.raw)} raw, ${kib(sizes.gzip)} gzip, ${kib(sizes.brotli)} brotli`);
        for (const file of sizes.files) {
            console.log(`  ${file.name}: ${kib(file.raw)} raw, ${kib(file.gzip)} gzip, ${kib(file.brotli)} brotli`);
        }
    }
}
