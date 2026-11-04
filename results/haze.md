# Results with Haze

Haze `2.1.0` on upstream Compose `1.13.0-beta01` against its fork's release `2.1.0-webcanvas.1`
(`d3e48305`) on the fork of Compose's release `1.13.0-beta01-webcanvas.5` (`076b062a2a8`). The
scenarios are in the [README](../README.md#with-haze): `panel` is one panel, `panels` six. The
download and the first frame are of this small app, with all six panels. Not measured in Safari.

## In Chrome

Chrome/156.0.8078.80 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version).
Viewport 1280×800 CSS px at 2×. 2026-11-03T22:41:41.578Z.

### Download size of the startup screen

| target | upstream (brotli) | Canvas 2D (brotli) | smaller by |
|---|---|---|---|
| wasmJs | 2830 KiB (9483 KiB raw) | 355 KiB (1310 KiB raw) | 8.0× |
| js | 2889 KiB (10459 KiB raw) | 438 KiB (2305 KiB raw) | 6.6× |

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 202 ms (n=5) | 63 ms (n=5) | 3.2× |
| wasmJs | repeat visit (HTTP and code caches) | 198 ms (n=5) | 59 ms (n=5) | 3.3× |
| js | first visit | 336 ms (n=5) | 136 ms (n=5) | 2.5× |
| js | repeat visit (HTTP and code caches) | 329 ms (n=5) | 136 ms (n=5) | 2.4× |

### Animated scenarios (frame rate uncapped; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | panels | 628 → **446** | 1.50 ms / 0.80 ms / 2.80 ms → **2.17 ms / 0.40 ms / 4.40 ms** | 3.19 ms → **5.80 ms** | 7 MiB → **2 MiB** |
| wasmJs | panel | 722 → **4372** | 1.28 ms / 0.40 ms / 2.70 ms → **0.15 ms / 0.10 ms / 0.30 ms** | 2.06 ms → **0.94 ms** | 7 MiB → **2 MiB** |
| js | panels | 629 → **445** | 1.49 ms / 0.90 ms / 2.80 ms → **2.17 ms / 0.40 ms / 25 ms** | 3.23 ms → **5.99 ms** | 16 MiB → **12 MiB** |
| js | panel | 723 → **4081** | 1.25 ms / 0.30 ms / 2.60 ms → **0.15 ms / 0.10 ms / 0.30 ms** | 2.13 ms → **1.02 ms** | 15 MiB → **11 MiB** |

## In Firefox

Firefox/159.0 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: Apple M1, or similar.
Viewport 1280×800 CSS px at 2×. 2026-11-04T13:20:09.243Z.

In Firefox the fork draws Haze's noise, a blend in soft-light, as hard-light, which its accelerated
Canvas 2D draws: these rows compare a different effect for the noise.

### Animated scenarios (frame rate 120; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | panels | 120 → **14** | 1.12 ms / 1.00 ms / 2.00 ms → **68 ms / 75 ms / 81 ms** | 3.14 ms → **69 ms** | – → **–** |
| wasmJs | panel | 120 → **120** | 0.93 ms / 1.00 ms / 2.00 ms → **0.51 ms / 0.00 ms / 1.00 ms** | 2.60 ms → **3.06 ms** | – → **–** |
| js | panels | 120 → **14** | 1.34 ms / 1.00 ms / 2.00 ms → **69 ms / 73 ms / 76 ms** | 3.76 ms → **68 ms** | – → **–** |
| js | panel | 120 → **120** | 1.58 ms / 1.00 ms / 3.00 ms → **1.04 ms / 1.00 ms / 2.00 ms** | 3.64 ms → **4.13 ms** | – → **–** |
