# Results with Haze

Chrome/156.0.8078.74 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version).
Viewport 1280×800 CSS px at 2×. 2026-10-31T12:38:38.975Z.

Haze `2.0.1` on upstream Compose `1.13.0-beta01` against its fork at `7d4973f0` on the fork of
Compose at `3474fb8af4a`. The scenarios are in the [README](../README.md#with-haze): `panel` is one
panel, `panels` six. The download and the first frame are of this small app, with all six panels.
Not measured in Safari.

### Download size of the startup screen

| target | upstream (brotli) | Canvas 2D (brotli) | smaller by |
|---|---|---|---|
| wasmJs | 2832 KiB (9473 KiB raw) | 346 KiB (1274 KiB raw) | 8.2× |
| js | 2885 KiB (10448 KiB raw) | 431 KiB (2277 KiB raw) | 6.7× |

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 201 ms (n=5) | 63 ms (n=5) | 3.2× |
| wasmJs | repeat visit (HTTP and code caches) | 199 ms (n=5) | 61 ms (n=5) | 3.3× |
| js | first visit | 354 ms (n=5) | 136 ms (n=5) | 2.6× |
| js | repeat visit (HTTP and code caches) | 354 ms (n=5) | 135 ms (n=5) | 2.6× |

### Animated scenarios (frame rate uncapped; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | panels | 628 → **445** | 1.51 ms / 0.60 ms / 2.80 ms → **2.17 ms / 0.40 ms / 4.40 ms** | 3.16 ms → **5.94 ms** | 7 MiB → **2 MiB** |
| wasmJs | panel | 726 → **4319** | 1.24 ms / 0.20 ms / 2.60 ms → **0.15 ms / 0.10 ms / 0.30 ms** | 2.03 ms → **0.95 ms** | 7 MiB → **2 MiB** |
| js | panels | 632 → **441** | 1.49 ms / 1.00 ms / 2.30 ms → **2.18 ms / 1.90 ms / 4.20 ms** | 3.71 ms → **6.00 ms** | 16 MiB → **12 MiB** |
| js | panel | 697 → **4315** | 1.22 ms / 0.60 ms / 2.50 ms → **0.15 ms / 0.10 ms / 0.30 ms** | 2.59 ms → **1.00 ms** | 15 MiB → **11 MiB** |
