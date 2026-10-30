// A minimal Chrome DevTools Protocol client: launches its own Chrome with a throwaway profile.

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export const defaultChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Launches Chrome and connects to it. [headless] runs it without a window; [extraArguments] are
 * passed to Chrome as is.
 */
export async function launchChrome({ path = defaultChromePath, headless = true, extraArguments = [] } = {}) {
    const profileDir = await mkdtemp(join(tmpdir(), 'compose-web-benchmark-'));
    const chrome = spawn(path, [
        `--user-data-dir=${profileDir}`,
        '--remote-debugging-port=0',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-component-update',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1280,800',
        ...(headless ? ['--headless=new'] : []),
        ...extraArguments,
        'about:blank',
    ], { stdio: 'ignore' });

    let endpoint = null;
    for (let attempt = 0; attempt < 200 && !endpoint; attempt++) {
        await sleep(50);
        const file = await readFile(join(profileDir, 'DevToolsActivePort'), 'utf8').catch(() => null);
        const [port, path] = file?.split('\n') ?? [];
        if (port && path) endpoint = `ws://127.0.0.1:${port}${path}`;
    }
    if (!endpoint) {
        chrome.kill();
        throw new Error('Chrome did not start');
    }
    const connection = await Connection.open(endpoint);
    connection.close = async () => {
        connection.socket.close();
        chrome.kill();
        await new Promise((resolve) => chrome.once('exit', resolve));
        await rm(profileDir, { recursive: true, force: true });
    };
    return connection;
}

class Connection {
    static open(endpoint) {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(endpoint);
            socket.onopen = () => resolve(new Connection(socket));
            socket.onerror = () => reject(new Error(`Could not connect to ${endpoint}`));
        });
    }

    constructor(socket) {
        this.socket = socket;
        this.nextId = 1;
        this.pending = new Map();
        this.listeners = new Set();
        socket.onmessage = ({ data }) => {
            const message = JSON.parse(data);
            if (message.id !== undefined) {
                const { resolve, reject, method } = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) reject(new Error(`${method}: ${message.error.message}`));
                else resolve(message.result);
            } else {
                for (const listener of this.listeners) listener(message);
            }
        };
    }

    /** Sends a command to the browser, or to the page of [sessionId]. */
    send(method, params = {}, sessionId = undefined) {
        const id = this.nextId++;
        this.socket.send(JSON.stringify({ id, method, params, sessionId }));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, method }));
    }

    /** Resolves with the first event [method] of [sessionId] for which [predicate] holds. */
    waitForEvent(method, sessionId, predicate = () => true) {
        return new Promise((resolve) => {
            const listener = (message) => {
                if (message.method === method && message.sessionId === sessionId && predicate(message.params)) {
                    this.listeners.delete(listener);
                    resolve(message.params);
                }
            };
            this.listeners.add(listener);
        });
    }

    /**
     * Opens a tab in a new browser context (its own cache, like a first visit) or in [contextId],
     * and returns a session for it.
     */
    async openPage({ contextId = null } = {}) {
        const browserContextId = contextId ?? (await this.send('Target.createBrowserContext')).browserContextId;
        const { targetId } = await this.send('Target.createTarget', { url: 'about:blank', browserContextId });
        const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
        const page = new Page(this, sessionId, targetId, browserContextId, contextId === null);
        await page.send('Page.enable');
        await page.send('Runtime.enable');
        await page.send('Network.enable');
        await page.send('Performance.enable', { timeDomain: 'timeTicks' });
        return page;
    }
}

class Page {
    constructor(connection, sessionId, targetId, contextId, ownsContext) {
        Object.assign(this, { connection, sessionId, targetId, contextId, ownsContext });
    }

    send(method, params = {}) {
        return this.connection.send(method, params, this.sessionId);
    }

    /** Evaluates [expression] in the page and returns its value. */
    async evaluate(expression) {
        const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
        });
        if (exceptionDetails) throw new Error(`${expression}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
        return result.value;
    }

    /** Polls [expression] until it is neither null nor undefined. */
    async waitFor(expression, { timeoutMs = 60_000, intervalMs = 25 } = {}) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const value = await this.evaluate(expression);
            if (value !== null && value !== undefined) return value;
            await sleep(intervalMs);
        }
        throw new Error(`Timed out waiting for ${expression}`);
    }

    async close() {
        await this.connection.send('Target.closeTarget', { targetId: this.targetId });
        if (this.ownsContext) {
            await this.connection.send('Target.disposeBrowserContext', { browserContextId: this.contextId });
        }
    }
}
