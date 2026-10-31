# Results in Chrome

Chrome/156.0.8078.74 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version).
Viewport 1280×800 CSS px at 2×. 2026-10-31T12:06:38.290Z.

Compose: upstream `1.13.0-beta01` against the fork at `3474fb8af4a`. Built and measured with the
sources of this repository; the raw results are not kept here, `runner/run.mjs` measures them again.
`perspective` on `js` varies more than the rest: reruns gave 1269 to 1671 frames per second on the
fork, 1888 to 2300 on upstream. For Safari, see [safari.md](safari.md), and with Haze,
[haze.md](haze.md).

### Download size of the startup screen

| target | upstream (brotli) | Canvas 2D (brotli) | smaller by |
|---|---|---|---|
| wasmJs | 3076 KiB (10569 KiB raw) | 545 KiB (2076 KiB raw) | 5.6× |
| js | 3074 KiB (11599 KiB raw) | 629 KiB (3423 KiB raw) | 4.9× |

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 235 ms (n=10) | 83 ms (n=10) | 2.8× |
| wasmJs | repeat visit (HTTP and code caches) | 230 ms (n=10) | 81 ms (n=10) | 2.8× |
| wasmJs | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 3537 ms (n=5) | 1045 ms (n=5) | 3.4× |
| js | first visit | 459 ms (n=10) | 236 ms (n=10) | 1.9× |
| js | repeat visit (HTTP and code caches) | 456 ms (n=10) | 235 ms (n=10) | 1.9× |
| js | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 4300 ms (n=5) | 1613 ms (n=5) | 2.7× |

### Animated scenarios (frame rate uncapped; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 1815 → **2584** | 0.37 ms / 0.20 ms / 1.10 ms → **0.23 ms / 0.20 ms / 0.50 ms** | 1.43 ms → **1.01 ms** | 13 MiB → **7 MiB** |
| wasmJs | layers | 220 → **738** | 4.33 ms / 4.10 ms / 6.20 ms → **1.16 ms / 1.10 ms / 1.40 ms** | 17 ms → **2.22 ms** | 12 MiB → **6 MiB** |
| wasmJs | fade | 735 → **2467** | 1.27 ms / 1.30 ms / 1.60 ms → **0.32 ms / 0.30 ms / 0.50 ms** | 4.00 ms → **1.16 ms** | 11 MiB → **4 MiB** |
| wasmJs | churn | 311 → **509** | 2.80 ms / 2.70 ms / 3.50 ms → **1.81 ms / 1.70 ms / 2.30 ms** | 5.72 ms → **2.86 ms** | 11 MiB → **9 MiB** |
| wasmJs | filters | 714 → **937** | 1.31 ms / 1.30 ms / 1.60 ms → **0.82 ms / 0.60 ms / 1.20 ms** | 4.27 ms → **4.18 ms** | 10 MiB → **4 MiB** |
| wasmJs | blur | 547 → **739** | 1.74 ms / 1.80 ms / 2.00 ms → **1.00 ms / 0.30 ms / 0.60 ms** | 5.59 ms → **4.47 ms** | 10 MiB → **3 MiB** |
| wasmJs | nested | 663 → **2227** | 1.42 ms / 1.40 ms / 1.60 ms → **0.37 ms / 0.40 ms / 0.50 ms** | 4.69 ms → **1.40 ms** | 11 MiB → **4 MiB** |
| wasmJs | perspective | 1694 → **1841** | 0.53 ms / 0.30 ms / 1.40 ms → **0.46 ms / 0.40 ms / 0.70 ms** | 1.20 ms → **1.83 ms** | 9 MiB → **3 MiB** |
| wasmJs | elevation | 958 → **959** | 0.97 ms / 0.90 ms / 1.60 ms → **0.45 ms / 0.40 ms / 0.50 ms** | 1.96 ms → **3.05 ms** | 9 MiB → **4 MiB** |
| wasmJs | shadows | 1016 → **2520** | 0.93 ms / 0.90 ms / 1.60 ms → **0.26 ms / 0.30 ms / 0.30 ms** | 1.85 ms → **1.24 ms** | 9 MiB → **4 MiB** |
| wasmJs | cutshadows | 767 → **2615** | 1.21 ms / 1.10 ms / 1.70 ms → **0.24 ms / 0.20 ms / 0.30 ms** | 2.65 ms → **1.21 ms** | 10 MiB → **4 MiB** |
| wasmJs | cardscroll | 904 → **1749** | 0.95 ms / 0.90 ms / 1.60 ms → **0.36 ms / 0.30 ms / 0.60 ms** | 2.28 ms → **1.54 ms** | 12 MiB → **8 MiB** |
| wasmJs | blend | 328 → **2770** | 2.94 ms / 2.90 ms / 3.60 ms → **0.29 ms / 0.30 ms / 0.40 ms** | 8.71 ms → **1.09 ms** | 10 MiB → **4 MiB** |
| wasmJs | canvas | 688 → **1323** | 1.42 ms / 1.40 ms / 1.60 ms → **0.67 ms / 0.70 ms / 0.80 ms** | 2.15 ms → **1.75 ms** | 9 MiB → **3 MiB** |
| wasmJs | text | 44 → **2225** | 7.92 ms / 7.80 ms / 9.10 ms → **0.32 ms / 0.30 ms / 0.40 ms** | 9.56 ms → **1.01 ms** | 12 MiB → **3 MiB** |
| wasmJs | effects | 943 → **3223** | 0.95 ms / 0.90 ms / 1.60 ms → **0.19 ms / 0.20 ms / 0.40 ms** | 1.88 ms → **1.12 ms** | 9 MiB → **3 MiB** |
| js | scroll | 1709 → **1720** | 0.34 ms / 0.30 ms / 0.80 ms → **0.32 ms / 0.30 ms / 0.70 ms** | 1.61 ms → **1.32 ms** | 32 MiB → **27 MiB** |
| js | layers | 217 → **484** | 4.39 ms / 4.30 ms / 4.90 ms → **1.86 ms / 1.80 ms / 2.10 ms** | 13 ms → **2.90 ms** | 25 MiB → **20 MiB** |
| js | fade | 775 → **2121** | 1.20 ms / 1.20 ms / 1.40 ms → **0.39 ms / 0.40 ms / 0.50 ms** | 3.71 ms → **1.21 ms** | 21 MiB → **17 MiB** |
| js | churn | 220 → **302** | 4.24 ms / 4.10 ms / 5.00 ms → **3.15 ms / 3.00 ms / 3.60 ms** | 7.14 ms → **4.33 ms** | 27 MiB → **25 MiB** |
| js | filters | 751 → **978** | 1.25 ms / 1.30 ms / 1.50 ms → **0.83 ms / 0.70 ms / 1.00 ms** | 4.11 ms → **4.14 ms** | 21 MiB → **17 MiB** |
| js | blur | 578 → **749** | 1.67 ms / 1.70 ms / 1.90 ms → **1.04 ms / 0.30 ms / 0.60 ms** | 5.40 ms → **4.43 ms** | 20 MiB → **15 MiB** |
| js | nested | 690 → **1758** | 1.39 ms / 1.40 ms / 1.70 ms → **0.50 ms / 0.50 ms / 0.70 ms** | 4.38 ms → **1.46 ms** | 21 MiB → **17 MiB** |
| js | perspective | 1727 → **1273** | 0.47 ms / 0.30 ms / 1.30 ms → **0.67 ms / 0.60 ms / 1.10 ms** | 1.34 ms → **2.52 ms** | 20 MiB → **16 MiB** |
| js | elevation | 1227 → **951** | 0.79 ms / 0.70 ms / 1.30 ms → **0.55 ms / 0.50 ms / 0.70 ms** | 1.98 ms → **3.27 ms** | 21 MiB → **17 MiB** |
| js | shadows | 1075 → **1940** | 0.87 ms / 0.80 ms / 1.50 ms → **0.37 ms / 0.40 ms / 0.50 ms** | 1.97 ms → **1.37 ms** | 21 MiB → **17 MiB** |
| js | cutshadows | 911 → **2008** | 1.03 ms / 0.90 ms / 1.70 ms → **0.35 ms / 0.30 ms / 0.40 ms** | 2.43 ms → **1.35 ms** | 21 MiB → **16 MiB** |
| js | cardscroll | 927 → **1302** | 0.88 ms / 0.90 ms / 1.60 ms → **0.50 ms / 0.40 ms / 0.90 ms** | 2.49 ms → **1.91 ms** | 30 MiB → **27 MiB** |
| js | blend | 310 → **2020** | 3.07 ms / 3.00 ms / 3.80 ms → **0.41 ms / 0.40 ms / 0.50 ms** | 10 ms → **1.27 ms** | 21 MiB → **17 MiB** |
| js | canvas | 533 → **981** | 1.82 ms / 1.80 ms / 2.00 ms → **0.92 ms / 0.90 ms / 1.00 ms** | 2.64 ms → **1.93 ms** | 19 MiB → **14 MiB** |
| js | text | 102 → **1549** | 9.50 ms / 9.30 ms / 12 ms → **0.49 ms / 0.50 ms / 0.60 ms** | 11 ms → **1.28 ms** | 27 MiB → **16 MiB** |
| js | effects | 971 → **3145** | 0.94 ms / 0.90 ms / 1.60 ms → **0.20 ms / 0.20 ms / 0.30 ms** | 2.00 ms → **1.20 ms** | 19 MiB → **16 MiB** |

### Text in 11 scripts with emoji (first visit, 10 s)

| target | build | first frame (median) | app download | fonts downloaded (median) |
|---|---|---|---|---|
| wasmJs | upstream | 188 ms (n=3) | 3077 KiB | 28 files, 1214 KiB, the last at 4594 ms |
| wasmJs | webcanvas | 73 ms (n=3) | 545 KiB | 0 files, 0 KiB |
| js | upstream | 367 ms (n=3) | 3075 KiB | 28 files, 1213 KiB, the last at 4578 ms |
| js | webcanvas | 179 ms (n=3) | 629 KiB | 0 files, 0 KiB |
