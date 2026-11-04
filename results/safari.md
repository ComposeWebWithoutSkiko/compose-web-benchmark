# Results in Safari

Safari/27.2 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: Apple GPU.
Viewport 1280×800 CSS px at 2×. 2026-11-04T10:58:35.940Z.

Compose: upstream `1.13.0-beta01` against the fork's release `1.13.0-beta01-webcanvas.5`
(`076b062a2a8`), the same builds as [chrome.md](chrome.md). Safari draws at the refresh rate of the
display, so the frame rates are capped and the CPU and main thread time per frame compare the
builds. The raw results are not kept here, `runner/safari.mjs` measures them again.

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 290 ms (n=10) | 138 ms (n=10) | 2.1× |
| wasmJs | repeat visit (HTTP and code caches) | 282 ms (n=10) | 134 ms (n=10) | 2.1× |
| js | first visit | 372 ms (n=10) | 221 ms (n=10) | 1.7× |
| js | repeat visit (HTTP and code caches) | 365 ms (n=10) | 218 ms (n=10) | 1.7× |

### Animated scenarios (frame rate capped by the display; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 60 → **60** | 1.74 ms / 1.00 ms / 6.00 ms → **2.33 ms / 2.00 ms / 4.00 ms** | 7.57 ms → **7.37 ms** | – → **–** |
| wasmJs | layers | 29 → **60** | 3.34 ms / 3.00 ms / 4.00 ms → **2.77 ms / 3.00 ms / 4.00 ms** | 16 ms → **7.80 ms** | – → **–** |
| wasmJs | fade | 60 → **60** | 1.73 ms / 2.00 ms / 2.00 ms → **2.17 ms / 2.00 ms / 3.00 ms** | 6.25 ms → **6.50 ms** | – → **–** |
| wasmJs | churn | 60 → **60** | 3.47 ms / 3.00 ms / 5.00 ms → **3.87 ms / 4.00 ms / 5.00 ms** | 6.33 ms → **7.83 ms** | – → **–** |
| wasmJs | filters | 60 → **60** | 1.64 ms / 2.00 ms / 3.00 ms → **4.92 ms / 5.00 ms / 6.00 ms** | 7.10 ms → **13 ms** | – → **–** |
| wasmJs | imagebrush | 60 → **60** | 1.07 ms / 1.00 ms / 2.00 ms → **1.03 ms / 1.00 ms / 2.00 ms** | 4.23 ms → **5.93 ms** | – → **–** |
| wasmJs | gradientbrush | 60 → **60** | 1.04 ms / 1.00 ms / 2.00 ms → **1.24 ms / 1.00 ms / 2.00 ms** | 4.15 ms → **6.17 ms** | – → **–** |
| wasmJs | compositebrush | 60 → **20** | 1.01 ms / 1.00 ms / 2.00 ms → **51 ms / 50 ms / 54 ms** | 4.09 ms → **75 ms** | – → **–** |
| wasmJs | softlight | 60 → **60** | 1.13 ms / 1.00 ms / 2.00 ms → **1.08 ms / 1.00 ms / 2.00 ms** | 4.17 ms → **6.00 ms** | – → **–** |
| wasmJs | newcontent | 60 → **60** | 1.33 ms / 1.00 ms / 4.00 ms → **1.28 ms / 1.00 ms / 3.00 ms** | 6.20 ms → **6.43 ms** | – → **–** |
| wasmJs | blur | 0 → **60** | – / – / – → **7.64 ms / 8.00 ms / 9.00 ms** | – → **12 ms** | – → **–** |
| wasmJs | nested | 60 → **60** | 1.75 ms / 2.00 ms / 3.00 ms → **2.11 ms / 2.00 ms / 3.00 ms** | 6.13 ms → **6.54 ms** | – → **–** |
| wasmJs | perspective | 60 → **60** | 1.74 ms / 2.00 ms / 3.00 ms → **6.19 ms / 6.00 ms / 7.00 ms** | 6.25 ms → **10 ms** | – → **–** |
| wasmJs | elevation | 60 → **60** | 1.29 ms / 1.00 ms / 2.00 ms → **2.71 ms / 3.00 ms / 3.00 ms** | 4.63 ms → **9.07 ms** | – → **–** |
| wasmJs | shadows | 60 → **60** | 2.01 ms / 2.00 ms / 3.00 ms → **1.71 ms / 2.00 ms / 2.00 ms** | 5.63 ms → **7.33 ms** | – → **–** |
| wasmJs | cutshadows | 60 → **60** | 2.16 ms / 2.00 ms / 3.00 ms → **0.95 ms / 1.00 ms / 1.00 ms** | 5.90 ms → **12 ms** | – → **–** |
| wasmJs | cardscroll | 60 → **60** | 1.61 ms / 1.00 ms / 7.00 ms → **2.04 ms / 2.00 ms / 4.00 ms** | 6.63 ms → **8.20 ms** | – → **–** |
| wasmJs | cardlist | 60 → **60** | 1.61 ms / 1.00 ms / 6.00 ms → **1.23 ms / 1.00 ms / 2.00 ms** | 7.03 ms → **11 ms** | – → **–** |
| wasmJs | blend | 60 → **60** | 0.86 ms / 1.00 ms / 1.00 ms → **2.10 ms / 2.00 ms / 3.00 ms** | 8.63 ms → **6.40 ms** | – → **–** |
| wasmJs | softlightlayers | 60 → **60** | 0.90 ms / 1.00 ms / 1.00 ms → **2.21 ms / 2.00 ms / 3.00 ms** | 8.53 ms → **6.68 ms** | – → **–** |
| wasmJs | canvas | 9 → **60** | 18 ms / 18 ms / 19 ms → **2.04 ms / 2.00 ms / 3.00 ms** | 122 ms → **7.26 ms** | – → **–** |
| wasmJs | text | 60 → **60** | 6.62 ms / 7.00 ms / 8.00 ms → **3.03 ms / 3.00 ms / 4.00 ms** | 8.93 ms → **6.67 ms** | – → **–** |
| wasmJs | effects | 60 → **60** | 1.77 ms / 2.00 ms / 3.00 ms → **2.35 ms / 2.00 ms / 3.00 ms** | 6.72 ms → **7.87 ms** | – → **–** |
| js | scroll | 60 → **60** | 2.03 ms / 1.00 ms / 8.00 ms → **2.55 ms / 2.00 ms / 7.00 ms** | 8.33 ms → **8.37 ms** | – → **–** |
| js | layers | 60 → **60** | 4.44 ms / 4.00 ms / 5.00 ms → **3.32 ms / 3.00 ms / 4.00 ms** | 16 ms → **8.87 ms** | – → **–** |
| js | fade | 60 → **60** | 1.31 ms / 1.00 ms / 2.00 ms → **1.94 ms / 2.00 ms / 3.00 ms** | 8.37 ms → **8.03 ms** | – → **–** |
| js | churn | 60 → **60** | 4.79 ms / 5.00 ms / 6.00 ms → **4.80 ms / 5.00 ms / 6.00 ms** | 15 ms → **15 ms** | – → **–** |
| js | filters | 60 → **60** | 1.58 ms / 2.00 ms / 2.00 ms → **4.72 ms / 4.00 ms / 6.00 ms** | 7.94 ms → **16 ms** | – → **–** |
| js | imagebrush | 60 → **60** | 1.91 ms / 2.00 ms / 3.00 ms → **1.35 ms / 1.00 ms / 2.00 ms** | 6.27 ms → **6.10 ms** | – → **–** |
| js | gradientbrush | 60 → **60** | 1.98 ms / 2.00 ms / 3.00 ms → **1.56 ms / 1.00 ms / 3.00 ms** | 6.63 ms → **6.53 ms** | – → **–** |
| js | compositebrush | 60 → **19** | 2.05 ms / 2.00 ms / 3.00 ms → **51 ms / 50 ms / 54 ms** | 6.30 ms → **80 ms** | – → **–** |
| js | softlight | 60 → **60** | 0.80 ms / 1.00 ms / 1.00 ms → **1.44 ms / 1.00 ms / 2.00 ms** | 8.97 ms → **6.97 ms** | – → **–** |
| js | newcontent | 60 → **60** | 1.75 ms / 1.00 ms / 5.00 ms → **1.51 ms / 1.00 ms / 4.00 ms** | 7.99 ms → **7.24 ms** | – → **–** |
| js | blur | 60 → **60** | 1.58 ms / 2.00 ms / 2.00 ms → **7.35 ms / 7.00 ms / 9.00 ms** | 9.03 ms → **15 ms** | – → **–** |
| js | nested | 60 → **60** | 1.56 ms / 2.00 ms / 2.00 ms → **1.91 ms / 2.00 ms / 3.00 ms** | 8.00 ms → **7.60 ms** | – → **–** |
| js | perspective | 60 → **60** | 1.37 ms / 1.00 ms / 3.00 ms → **5.78 ms / 6.00 ms / 7.00 ms** | 7.97 ms → **13 ms** | – → **–** |
| js | elevation | 60 → **60** | 1.91 ms / 2.00 ms / 4.00 ms → **2.29 ms / 2.00 ms / 3.00 ms** | 8.00 ms → **11 ms** | – → **–** |
| js | shadows | 60 → **60** | 2.44 ms / 3.00 ms / 4.00 ms → **1.82 ms / 2.00 ms / 3.00 ms** | 6.69 ms → **8.17 ms** | – → **–** |
| js | cutshadows | 60 → **60** | 2.75 ms / 3.00 ms / 4.00 ms → **1.05 ms / 1.00 ms / 2.00 ms** | 6.83 ms → **13 ms** | – → **–** |
| js | cardscroll | 60 → **60** | 2.35 ms / 2.00 ms / 7.00 ms → **2.24 ms / 2.00 ms / 5.00 ms** | 8.07 ms → **9.63 ms** | – → **–** |
| js | cardlist | 60 → **60** | 2.03 ms / 1.00 ms / 7.00 ms → **1.85 ms / 2.00 ms / 5.00 ms** | 8.39 ms → **13 ms** | – → **–** |
| js | blend | 60 → **60** | 1.07 ms / 1.00 ms / 2.00 ms → **1.88 ms / 2.00 ms / 3.00 ms** | 10 ms → **8.50 ms** | – → **–** |
| js | softlightlayers | 60 → **60** | 1.04 ms / 1.00 ms / 2.00 ms → **1.87 ms / 2.00 ms / 3.00 ms** | 11 ms → **8.17 ms** | – → **–** |
| js | canvas | 60 → **60** | 3.27 ms / 3.00 ms / 4.00 ms → **2.20 ms / 2.00 ms / 3.00 ms** | 6.77 ms → **7.63 ms** | – → **–** |
| js | text | 60 → **60** | 8.01 ms / 8.00 ms / 10 ms → **2.52 ms / 3.00 ms / 3.00 ms** | 13 ms → **9.60 ms** | – → **–** |
| js | effects | 60 → **60** | 1.72 ms / 2.00 ms / 3.00 ms → **2.08 ms / 2.00 ms / 3.00 ms** | 7.10 ms → **8.07 ms** | – → **–** |

### Errors and warnings of the measured pages

| target | build | measurement | runs | errors and console |
|---|---|---|---|---|
| wasmJs | upstream | blur | 3 | error: kotlin.RuntimeException: Can't wrap nullptr |
