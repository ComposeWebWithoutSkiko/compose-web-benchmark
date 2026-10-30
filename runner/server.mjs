// Serves the production builds of the app the way a CDN would: brotli-compressed when the browser
// accepts it, cacheable for a year.
//
//   /<compose build>/<target>/...  ->  build/<compose build>/dist/<target>/productionExecutable/...
//   /micro/...                     ->  micro/...
//   /v/<visit>/...                 ->  the same as /...: files a browser hasn't cached under this
//                                      path, for first visits in a browser whose cache the runner
//                                      can't clear (runner/safari.mjs)
//
// e.g. /upstream/wasmJs/index.html?scenario=scroll. A page opened by runner/safari.mjs posts what it
// measured to /runs/<run>/<event>. Run it alone with `node runner/server.mjs [port]`.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { brotliCompressSync, constants } from 'node:zlib';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectDir = fileURLToPath(new URL('..', import.meta.url));

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.wasm': 'application/wasm',
    '.json': 'application/json',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.map': 'application/json',
};

/** The directory a build of the app is served from. */
export function distDir(composeBuild, target) {
    return join(projectDir, 'build', composeBuild, 'dist', target, 'productionExecutable');
}

const compressed = new Map();

async function brotli(path) {
    const { mtimeMs } = await stat(path);
    const cached = compressed.get(path);
    if (cached && cached.mtimeMs === mtimeMs) return cached.data;
    const data = brotliCompressSync(await readFile(path), {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    });
    compressed.set(path, { mtimeMs, data });
    return data;
}

async function handle(request, response, onRunEvent) {
    const url = new URL(request.url, 'http://localhost');
    const runEvent = /^\/runs\/([^/]+)\/([^/]+)$/.exec(url.pathname);
    if (request.method === 'POST' && runEvent && onRunEvent) {
        let body = '';
        for await (const chunk of request) body += chunk;
        await onRunEvent(runEvent[1], runEvent[2], JSON.parse(body));
        response.writeHead(204).end();
        return;
    }
    const pathname = url.pathname.replace(/^\/v\/[^/]+(?=\/)/, '');
    const [, first, ...segments] = pathname.split('/');
    // /micro/... are the micro-benchmarks, the rest the builds of the app.
    const isMicro = first === 'micro';
    const rest = isMicro ? segments : segments.slice(1);
    const relative = normalize(rest.join('/') || 'index.html');
    if (!first || (!isMicro && !segments[0]) || relative.startsWith('..') || relative.includes(`${sep}..`)) {
        response.writeHead(404).end();
        return;
    }
    const root = isMicro ? join(projectDir, 'micro') : distDir(first, segments[0]);
    const path = join(root, relative);
    try {
        const headers = {
            'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000',
            'Vary': 'Accept-Encoding',
        };
        const acceptsBrotli = /\bbr\b/.test(request.headers['accept-encoding'] ?? '');
        const body = acceptsBrotli ? await brotli(path) : await readFile(path);
        if (acceptsBrotli) headers['Content-Encoding'] = 'br';
        headers['Content-Length'] = body.length;
        response.writeHead(200, headers).end(body);
    } catch (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
    }
}

/**
 * Starts the server on [port] (0: any free port) and returns its origin. [onRunEvent] receives the
 * events pages post to /runs/<run>/<event> as (run, event, data); a page gets the answer once the
 * promise it returns completes.
 */
export function startServer(port = 0, { onRunEvent = null } = {}) {
    return new Promise((resolve) => {
        const server = createServer((request, response) => {
            handle(request, response, onRunEvent).catch(() => response.writeHead(500).end());
        });
        server.listen(port, '127.0.0.1', () => {
            resolve({ origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
        });
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { origin } = await startServer(Number(process.argv[2] ?? 8080));
    console.log(`Serving ${join(projectDir, 'build')} at ${origin}/<upstream|webcanvas>/<wasmJs|js>/`);
}
