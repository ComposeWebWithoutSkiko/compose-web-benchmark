# Compose Web benchmark

One Compose Multiplatform app, built twice from the same sources with the same Gradle setup:

- **upstream**: JetBrains' Compose Multiplatform `1.13.0-beta01` from Maven Central, which draws
  with Skia compiled to WebAssembly (`skiko.wasm`) through WebGL 2;
- **webcanvas**: the same release with the web renderer of
  [ComposeWebWithoutSkiko/compose-multiplatform-core](https://github.com/ComposeWebWithoutSkiko/compose-multiplatform-core)
  (branch `web-canvas/1.13`), which draws with the browser's Canvas 2D API and has no Skia.

Both are built for Kotlin/Wasm (`wasmJs`) and Kotlin/JS (`js`), as production bundles
(`*BrowserDistribution`: webpack in production mode, Binaryen for Wasm).

## Scenarios

The app (`src/webMain/kotlin/bench`) is Material 3. The `scenario` query parameter picks the screen:

| scenario | what it does |
|---|---|
| `startup` | an inbox: a `Scaffold` with a top app bar, a FAB and a `LazyColumn` of `ListItem`s |
| `scroll` | the inbox with 100 000 messages, scrolled by 16 px in every frame |
| `i18n` | text in 11 scripts (Latin, Cyrillic, Greek, Arabic, Hebrew, Devanagari, Chinese, Japanese, Korean, Thai) and emoji |
| `layers` | 400 boxes, each its own graphics layer of a single shape, rotated, scaled and faded in every frame (the case where a fade applies to the shape directly) |
| `fade` | 60 cards with a background and a text, each faded in and out (layers of several draws) |
| `churn` | the same cards fading, moving by fractions of pixels and showing a number and a bar that change in every frame: nothing can be reused between frames |
| `filters` | the same cards with their saturation changing, through color matrices |
| `blur` | 24 cards blurred by a changing radius, every other one with clamped edges |
| `nested` | 10 groups of 6 cards, the groups and the cards fading: layers in layers |
| `perspective` | 24 cards turning around their vertical axis |
| `elevation` | 60 cards whose elevation, and so whose shadows, change in every frame |
| `shadows` | 60 cards with shadows that stay as they are, under a bar that grows in every frame |
| `cutshadows` | the same with cut corners: shadows of paths rather than of rounded rectangles |
| `cardscroll` | rows of cards with shadows, scrolled by 16 px in every frame: the same shadows, moved |
| `blend` | 60 fading cards multiplied onto a gradient (a layer blend mode) |
| `canvas` | 1500 circles, rectangles and lines and 100 stars drawn with `Canvas`, all moving |
| `text` | 12 styled paragraphs whose widths change in every frame, so they are laid out again |
| `effects` | 40 cards with shadows and gradients under a blurred circle (`BlurEffect`) that moves |

`index.html` holds the probes, the same for both builds: when Compose drew its first frame, the
frames an animated scenario counted, and the time each animation frame spent in
`requestAnimationFrame` callbacks (the work of Compose and of its renderer on the main thread).

## Measurements

`runner/run.mjs` drives a Chrome of its own (headless, with a throwaway profile) through the
DevTools protocol. The app is served by `runner/server.mjs`, brotli-compressed like a CDN would.

- **Download size**: the bytes of the app's files the startup screen loads (brotli), from
  Resource Timing.
- **Time to the first frame**: from the navigation to the start of the animation frame after the
  one in which Compose drew for the first time (the first frame has then been submitted, including
  Skia's WebGL work). Three kinds of loads:
  - *first visit*: a new browser context, nothing cached;
  - *repeat visit*: the HTTP cache and V8's cache of compiled Wasm code hold the app;
  - *first visit, throttled*: CPU 4× slower, 10 Mbit/s down, 2 Mbit/s up, 100 ms round trips.
- **Animated scenarios**, after 3 s of warm-up, over 5 s, with the frame rate uncapped
  (`--disable-frame-rate-limit --disable-gpu-vsync`), so that it is the throughput of the whole
  pipeline rather than the refresh rate of the display. An animation advances by 1/60 s in every
  frame, however fast a build draws, so that both builds draw the same frames:
  - frames per second;
  - main thread work per frame (median and 95th percentile);
  - CPU time per frame of the page's process and of the GPU process together (the GPU process
    rasterizes Canvas 2D and runs the WebGL commands of Skia), from `SystemInfo.getProcessInfo`;
  - the JS heap and the array buffers (Skia's Wasm memory) after a garbage collection.
- **Text in many scripts**: what the page downloads in its first 10 s, fonts included.

The two builds alternate within every repetition, so that a change of the machine's state (heat,
background work) affects both alike.

### In Safari

`runner/safari.mjs` runs the startup and animated suites in the running Safari, which has no
DevTools protocol: it opens every page in a window of its own through AppleScript, and the page
measures itself (`index.html`, when its fragment has a `run` parameter) and posts what it measured
to the server. It needs no setting of Safari changed. What differs from Chrome:

- Safari draws at the refresh rate of the display, so the frame rates are capped, and the main
  thread and CPU time per frame are what compare the builds. `performance.now()` is rounded to the
  millisecond there, so the table gives the mean time per frame too.
- The CPU time of a frame is that of the busiest WebKit page process and the busiest WebKit GPU
  process while the frames are measured, from `ps`.
- A first visit loads the app from a path of its own (`/v/<visit>/...`), which Safari hasn't
  cached. The window has the viewport of `run.mjs`, at the pixel density of the display.
- No throttled loads, download sizes, heap, or text in many scripts.
- Uncaught errors, errors and warnings logged to the console, and lost WebGL contexts are recorded,
  and the summary lists them.

Safari draws nothing in a window hidden behind another app's, or on a locked screen: while a page
is hidden, the runner waits for it to be shown and measures it again. It brings Safari to the front
only when it starts. It saves its results after every scenario, so a run that ends early keeps
them; `summarize.mjs` combines them with a run of the remaining `--scenarios`.

## Results

[`results/chrome.md`](results/chrome.md) and [`results/safari.md`](results/safari.md) have the
tables measured in Chrome and in Safari. Raw results are large and stay out of the repository: the
commands below measure them again.

## Running it

Requirements: JDK 17+, Node.js 22+, Google Chrome; for `runner/safari.mjs`, macOS and Safari.

```sh
# 1. The Canvas 2D build of Compose, into Maven Local as 1.13.0-beta01-webcanvas:
git clone -b web-canvas/1.13 https://github.com/ComposeWebWithoutSkiko/compose-multiplatform-core
cd compose-multiplatform-core
./gradlew :mpp:publishComposeJbToMavenLocal -Pcompose.platforms=web \
    -Pjetbrains.publication.libraries=COMPOSE,COMPOSE_MATERIAL3 \
    -Pjetbrains.publication.version.COMPOSE=1.13.0-beta01-webcanvas \
    -Pjetbrains.publication.version.COMPOSE_MATERIAL3=1.13.0-beta01-webcanvas

# 2. Both builds of the app:
cd ../compose-web-benchmark
./gradlew -Pcompose=upstream wasmJsBrowserDistribution jsBrowserDistribution
./gradlew -Pcompose=webcanvas wasmJsBrowserDistribution jsBrowserDistribution

# 3. The benchmark (about 15 minutes), then the tables:
node runner/run.mjs
node runner/summarize.mjs results/<time>.json

# The same in Safari (about 40 minutes, with Safari's windows visible):
node runner/safari.mjs
node runner/summarize.mjs results/<time>-safari.json

# Bundle sizes of the builds, file by file; screenshots of every scenario of both builds:
node runner/sizes.mjs
node runner/screenshots.mjs

# Or look at the app: http://127.0.0.1:8080/<upstream|webcanvas>/<wasmJs|js>/index.html?scenario=scroll
node runner/server.mjs 8080
```

Options of `runner/run.mjs`: `--suites startup,throttled,runtime,i18n`,
`--builds upstream,webcanvas`, `--targets wasmJs,js`, `--runs 10` (startup loads per build;
half as many throttled ones), `--scenarios` (the animated scenarios, all by default), `--headed`.
`runner/safari.mjs` takes the same but `--headed`, with `--suites startup,runtime`.

`runner/sizes.mjs` lists every file of a bundle, including ones that aren't loaded: webpack puts
`skiko.wasm` in the upstream `js` bundle twice, and the page loads one of them. The download size
of the benchmark counts what the page loads.
