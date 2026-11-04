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
| `imagebrush` | 60 cards filled with a tiled image whose saturation changes, through color matrices: an image shader through a color filter |
| `gradientbrush` | the same cards filled with a gradient: a gradient through a color filter |
| `compositebrush` | the same cards filled with a blend of two gradients, which no fill style draws: a shader drawn as an image, through a color filter |
| `softlight` | 60 cards with a tiled image drawn over them in soft-light with a paint, its alpha changing: a blend mode that Firefox's accelerated Canvas 2D doesn't draw (Haze blends its noise in soft-light through a render effect: the panels of the Haze app below) |
| `newcontent` | a list of cards whose texts, each in an offscreen layer, are new in each of the first 120 frames, then scrolled by 16 px in every frame: content coming after the start, which Firefox can take a canvas off acceleration for |
| `blur` | 24 cards blurred by a changing radius, every other one with clamped edges |
| `nested` | 10 groups of 6 cards, the groups and the cards fading: layers in layers |
| `perspective` | 24 cards turning around their vertical axis |
| `elevation` | 60 cards whose elevation, and so whose shadows, change in every frame |
| `shadows` | 60 cards with shadows that stay as they are, under a bar that grows in every frame |
| `cutshadows` | the same with cut corners: shadows of paths rather than of rounded rectangles |
| `cardscroll` | rows of cards with shadows, scrolled by 16 px in every frame: the same shadows, moved |
| `cardlist` | the inbox's messages in a card with rounded corners, scrolled by 16 px in every frame: list items whose backgrounds reach the edges of the card's clip, between their texts |
| `blend` | 60 fading cards multiplied onto a gradient (a layer blend mode) |
| `softlightlayers` | the same in soft-light: layers that Firefox's accelerated Canvas 2D composites by reading the canvas back |
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

### In Firefox

`runner/firefox.mjs` runs the animated suite in a Firefox of its own, with a throwaway profile,
through WebDriver BiDi, and reads the probes of the page as `run.mjs` does. What differs from
Chrome:

- Firefox draws at a fixed frame rate (`layout.frame_rate`, `--frame-rate`, 120 by default), so the
  frame rates are capped, and the main thread and CPU time per frame are what compare the builds
  when both reach the cap.
- The CPU time of a frame is that of the tab processes and the GPU process of that Firefox while
  the frames are measured, from `ps`.
- Firefox's other prefs are its own, its timer included, so that the builds run as they would for a
  user; the results record the prefs the profile sets.
- No startup, throttled loads, download sizes, heap, or text in many scripts.

Firefox on macOS draws nothing in a window that other windows cover: a page hidden while it is
measured is measured again once it is shown.

### With Haze

[`haze/`](haze) is an app of its own, so that a library the benchmark's app doesn't need stays out
of the numbers above: [Haze](https://github.com/chrisbanes/haze) `2.1.0` from Maven Central on
upstream Compose, against
[the fork of Haze](https://github.com/ComposeWebWithoutSkiko/haze/tree/web-canvas/2.1) on the Canvas
2D build. Panels of 340×340 CSS px over stripes that move in every frame:

| scenario | what it does |
|---|---|
| `panels` | six panels: a blur with noise under a tint, a plain blur, a mask, a background under a gradient tint, and a progressive blur at the default performance mode and at `Quality` |
| `panel` | only the first one |

`runner/run.mjs --app haze` and `runner/firefox.mjs --app haze` measure them like the other
scenarios, in Chrome and in Firefox; this app has no text in many scripts.

## Results

[`results/chrome.md`](results/chrome.md), [`results/safari.md`](results/safari.md),
[`results/firefox.md`](results/firefox.md) and [`results/haze.md`](results/haze.md) have the tables
measured in Chrome, in Safari, in Firefox and with Haze.
Raw results are large and stay out of the repository: the commands below measure them again.

## Running it

Requirements: JDK 17+, Node.js 22+, Google Chrome; for `runner/safari.mjs`, macOS and Safari; for
`runner/firefox.mjs`, macOS and Firefox.

```sh
# 1. Both builds of the app. The Canvas 2D build of Compose comes from https://repo.redlance.org/public:
./gradlew -Pcompose=upstream wasmJsBrowserDistribution jsBrowserDistribution
./gradlew -Pcompose=webcanvas wasmJsBrowserDistribution jsBrowserDistribution

# 2. The benchmark (about 15 minutes), then the tables:
node runner/run.mjs
node runner/summarize.mjs results/<time>.json

# The same in Safari (about 40 minutes, with Safari's windows visible):
node runner/safari.mjs
node runner/summarize.mjs results/<time>-safari.json

# The animated scenarios in Firefox (about 40 minutes, with Firefox's window visible):
node runner/firefox.mjs
node runner/summarize.mjs results/<time>-firefox.json

# With Haze. Its fork is published for wasmJs only and this app also builds js, so clone it next to
# this repository; it builds with JDK 25 and its own Gradle:
git clone -b web-canvas/2.1 https://github.com/ComposeWebWithoutSkiko/haze ../haze
../haze/gradlew -p haze -Pcompose=upstream wasmJsBrowserDistribution jsBrowserDistribution
../haze/gradlew -p haze -Pcompose=webcanvas wasmJsBrowserDistribution jsBrowserDistribution
node runner/run.mjs --app haze --suites startup,runtime --runs 5
node runner/summarize.mjs results/<time>.json
node runner/firefox.mjs --app haze
node runner/summarize.mjs results/<time>-firefox.json

# Bundle sizes of the builds, file by file; screenshots of every scenario of both builds:
node runner/sizes.mjs
node runner/screenshots.mjs

# Or look at the app: http://127.0.0.1:8080/<upstream|webcanvas>/<wasmJs|js>/index.html?scenario=scroll
node runner/server.mjs 8080
```

Options of `runner/run.mjs`: `--suites startup,throttled,runtime,i18n` (`i18n` only for an app
that has the text in many scripts), `--builds upstream,webcanvas`, `--targets wasmJs,js`,
`--runs 10` (startup loads per build; half as many throttled ones), `--scenarios` (the animated
scenarios of the app, all by default), `--headed`, `--app haze` (the app of `haze/`).
`runner/safari.mjs` takes the same but `--headed` and `--app`, with `--suites startup,runtime`.
`runner/firefox.mjs` takes `--builds`, `--targets`, `--scenarios`, `--app` and `--frame-rate 120`.

`runner/sizes.mjs` lists every file of a bundle, including ones that aren't loaded: webpack puts
`skiko.wasm` in the upstream `js` bundle twice, and the page loads one of them. The download size
of the benchmark counts what the page loads.
