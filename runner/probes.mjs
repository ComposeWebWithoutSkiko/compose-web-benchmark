// The expressions that the runners driving a browser (run.mjs, firefox.mjs) evaluate in a page: the
// probes of index.html, and the GPU.

/** The time and the frames the page has counted. */
export const frameCount = '({ time: performance.now(), frames: __bench.frames })';

/** Starts recording the work of every frame (see index.html). */
export const startFrameWork = '__bench.frameWork = []';

/** Stops recording the work of every frame and returns it: the milliseconds of every frame. */
export const takeFrameWork = '(() => { const work = __bench.frameWork; __bench.frameWork = null; return work; })()';

/** The GPU, as WebGL 2 names it. */
export const gpuName = `(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return 'no WebGL 2';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
})()`;
