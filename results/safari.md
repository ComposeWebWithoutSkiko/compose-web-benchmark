# Results in Safari

Safari/27.2 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: Apple GPU.
Viewport 1280×800 CSS px at 2×. 2026-10-30T23:41:23.732Z.

Compose: upstream `1.13.0-beta01` against the fork at `3dbb0d27622`. Safari draws at the refresh
rate of the display, so the frame rates are capped and the CPU and main thread time per frame
compare the builds. The raw results are not kept here, `runner/safari.mjs` measures them again.

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 267 ms (n=10) | 147 ms (n=10) | 1.8× |
| wasmJs | repeat visit (HTTP and code caches) | 264 ms (n=10) | 143 ms (n=10) | 1.8× |
| js | first visit | 383 ms (n=10) | 256 ms (n=10) | 1.5× |
| js | repeat visit (HTTP and code caches) | 385 ms (n=10) | 248 ms (n=10) | 1.6× |

### Animated scenarios (frame rate capped by the display; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 60 → **60** | 0.75 ms / 1.00 ms / 2.00 ms → **1.50 ms / 1.00 ms / 3.00 ms** | 10 ms → **11 ms** | – → **–** |
| wasmJs | layers | 26 → **60** | 3.11 ms / 3.00 ms / 4.00 ms → **1.81 ms / 2.00 ms / 2.00 ms** | 34 ms → **12 ms** | – → **–** |
| wasmJs | fade | 60 → **60** | 0.62 ms / 1.00 ms / 1.00 ms → **1.06 ms / 1.00 ms / 2.00 ms** | 10 ms → **12 ms** | – → **–** |
| wasmJs | churn | 60 → **60** | 2.88 ms / 3.00 ms / 3.00 ms → **3.55 ms / 4.00 ms / 4.00 ms** | 9.80 ms → **11 ms** | – → **–** |
| wasmJs | filters | 60 → **60** | 0.91 ms / 1.00 ms / 1.00 ms → **4.39 ms / 4.00 ms / 5.00 ms** | 11 ms → **18 ms** | – → **–** |
| wasmJs | blur | 0 → **60** | – / – / – → **8.91 ms / 9.00 ms / 11 ms** | – → **20 ms** | – → **–** |
| wasmJs | nested | 60 → **60** | 0.53 ms / 1.00 ms / 1.00 ms → **1.06 ms / 1.00 ms / 2.00 ms** | 10 ms → **12 ms** | – → **–** |
| wasmJs | perspective | 60 → **60** | 0.59 ms / 1.00 ms / 1.00 ms → **6.64 ms / 7.00 ms / 7.00 ms** | 9.90 ms → **16 ms** | – → **–** |
| wasmJs | elevation | 60 → **60** | 0.42 ms / 0.00 ms / 1.00 ms → **1.37 ms / 1.00 ms / 2.00 ms** | 9.70 ms → **12 ms** | – → **–** |
| wasmJs | shadows | 60 → **60** | 0.65 ms / 1.00 ms / 1.00 ms → **0.97 ms / 1.00 ms / 1.00 ms** | 9.83 ms → **12 ms** | – → **–** |
| wasmJs | cutshadows | 60 → **60** | 0.64 ms / 1.00 ms / 1.00 ms → **1.02 ms / 1.00 ms / 1.00 ms** | 10 ms → **20 ms** | – → **–** |
| wasmJs | cardscroll | 60 → **60** | 0.63 ms / 1.00 ms / 2.00 ms → **1.40 ms / 1.00 ms / 3.00 ms** | 9.87 ms → **13 ms** | – → **–** |
| wasmJs | blend | 60 → **60** | 1.05 ms / 1.00 ms / 2.00 ms → **1.09 ms / 1.00 ms / 2.00 ms** | 15 ms → **11 ms** | – → **–** |
| wasmJs | canvas | 8 → **60** | 22 ms / 21 ms / 25 ms → **0.89 ms / 1.00 ms / 1.00 ms** | 183 ms → **11 ms** | – → **–** |
| wasmJs | text | 60 → **60** | 7.59 ms / 8.00 ms / 9.00 ms → **2.01 ms / 2.00 ms / 3.00 ms** | 14 ms → **11 ms** | – → **–** |
| wasmJs | effects | 60 → **60** | 0.65 ms / 1.00 ms / 1.00 ms → **1.83 ms / 2.00 ms / 2.00 ms** | 9.80 ms → **13 ms** | – → **–** |
| js | scroll | 60 → **60** | 1.61 ms / 1.00 ms / 5.00 ms → **2.09 ms / 2.00 ms / 5.00 ms** | 10.00 ms → **11 ms** | – → **–** |
| js | layers | 60 → **60** | 4.85 ms / 5.00 ms / 5.00 ms → **2.86 ms / 3.00 ms / 3.00 ms** | 20 ms → **12 ms** | – → **–** |
| js | fade | 60 → **60** | 1.05 ms / 1.00 ms / 2.00 ms → **1.34 ms / 1.00 ms / 2.00 ms** | 11 ms → **11 ms** | – → **–** |
| js | churn | 60 → **60** | 5.47 ms / 5.00 ms / 6.00 ms → **5.33 ms / 5.00 ms / 6.00 ms** | 17 ms → **19 ms** | – → **–** |
| js | filters | 60 → **60** | 1.26 ms / 1.00 ms / 2.00 ms → **5.04 ms / 5.00 ms / 6.00 ms** | 11 ms → **20 ms** | – → **–** |
| js | blur | 60 → **60** | 1.31 ms / 1.00 ms / 2.00 ms → **9.12 ms / 9.00 ms / 11 ms** | 12 ms → **20 ms** | – → **–** |
| js | nested | 60 → **60** | 1.13 ms / 1.00 ms / 2.00 ms → **1.33 ms / 1.00 ms / 2.00 ms** | 12 ms → **12 ms** | – → **–** |
| js | perspective | 60 → **60** | 0.79 ms / 1.00 ms / 1.00 ms → **6.59 ms / 7.00 ms / 7.00 ms** | 9.87 ms → **18 ms** | – → **–** |
| js | elevation | 60 → **60** | 1.06 ms / 1.00 ms / 2.00 ms → **1.70 ms / 2.00 ms / 2.00 ms** | 10 ms → **13 ms** | – → **–** |
| js | shadows | 60 → **60** | 0.92 ms / 1.00 ms / 1.00 ms → **1.26 ms / 1.00 ms / 2.00 ms** | 9.77 ms → **12 ms** | – → **–** |
| js | cutshadows | 60 → **60** | 1.19 ms / 1.00 ms / 2.00 ms → **1.30 ms / 1.00 ms / 2.00 ms** | 9.90 ms → **19 ms** | – → **–** |
| js | cardscroll | 60 → **60** | 1.69 ms / 1.00 ms / 5.00 ms → **1.81 ms / 2.00 ms / 4.00 ms** | 11 ms → **13 ms** | – → **–** |
| js | blend | 60 → **60** | 1.24 ms / 1.00 ms / 2.00 ms → **1.27 ms / 1.00 ms / 2.00 ms** | 15 ms → **12 ms** | – → **–** |
| js | canvas | 60 → **60** | 1.96 ms / 2.00 ms / 2.00 ms → **1.08 ms / 1.00 ms / 2.00 ms** | 10 ms → **11 ms** | – → **–** |
| js | text | 60 → **60** | 9.63 ms / 10 ms / 12 ms → **2.20 ms / 2.00 ms / 3.00 ms** | 19 ms → **12 ms** | – → **–** |
| js | effects | 60 → **60** | 0.83 ms / 1.00 ms / 1.00 ms → **1.98 ms / 2.00 ms / 3.00 ms** | 9.97 ms → **13 ms** | – → **–** |

### Errors and warnings of the measured pages

| target | build | measurement | runs | errors and console |
|---|---|---|---|---|
| wasmJs | upstream | blur | 3 | error: kotlin.RuntimeException: Can't wrap nullptr |
