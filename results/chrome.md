# Results in Chrome

Chrome/156.0.8078.74 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version).
Viewport 1280×800 CSS px at 2×. 2026-10-30T19:29:19.070Z.

Compose: upstream `1.13.0-beta01` against the fork at `3dbb0d27622`. Built and measured with
the sources of this repository; the raw results are not kept here, `runner/run.mjs` measures them
again. For Safari, see [safari.md](safari.md).

### Download size of the startup screen

| target | upstream (brotli) | Canvas 2D (brotli) | smaller by |
|---|---|---|---|
| wasmJs | 3077 KiB (10569 KiB raw) | 588 KiB (2310 KiB raw) | 5.2× |
| js | 3074 KiB (11600 KiB raw) | 627 KiB (3416 KiB raw) | 4.9× |

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 239 ms (n=10) | 95 ms (n=10) | 2.5× |
| wasmJs | repeat visit (HTTP and code caches) | 234 ms (n=10) | 93 ms (n=10) | 2.5× |
| wasmJs | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 3583 ms (n=5) | 1165 ms (n=5) | 3.1× |
| js | first visit | 469 ms (n=10) | 237 ms (n=10) | 2.0× |
| js | repeat visit (HTTP and code caches) | 471 ms (n=10) | 243 ms (n=10) | 1.9× |
| js | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 4485 ms (n=5) | 1718 ms (n=5) | 2.6× |

### Text in 11 scripts with emoji (first visit, 10 s)

| target | build | first frame (median) | app download | fonts downloaded (median) |
|---|---|---|---|---|
| wasmJs | upstream | 208 ms (n=3) | 3078 KiB | 28 files, 1213 KiB, the last at 4246 ms |
| wasmJs | webcanvas | 92 ms (n=3) | 588 KiB | 0 files, 0 KiB |
| js | upstream | 382 ms (n=3) | 3075 KiB | 28 files, 1213 KiB, the last at 4361 ms |
| js | webcanvas | 184 ms (n=3) | 628 KiB | 0 files, 0 KiB |

### Animated scenarios (frame rate uncapped; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 1679 → **2958** | 0.45 ms / 0.30 ms / 1.20 ms → **0.20 ms / 0.20 ms / 0.40 ms** | 1.30 ms → **0.90 ms** | 13 MiB → **8 MiB** |
| wasmJs | layers | 228 → **795** | 4.13 ms / 3.80 ms / 6.10 ms → **1.09 ms / 1.10 ms / 1.30 ms** | 16 ms → **1.97 ms** | 12 MiB → **7 MiB** |
| wasmJs | fade | 765 → **2731** | 1.23 ms / 1.30 ms / 1.50 ms → **0.29 ms / 0.30 ms / 0.40 ms** | 3.76 ms → **1.02 ms** | 11 MiB → **4 MiB** |
| wasmJs | churn | 349 → **581** | 2.61 ms / 2.50 ms / 3.40 ms → **1.62 ms / 1.50 ms / 2.00 ms** | 4.99 ms → **2.43 ms** | 12 MiB → **9 MiB** |
| wasmJs | filters | 754 → **984** | 1.28 ms / 1.30 ms / 1.50 ms → **0.80 ms / 0.60 ms / 1.00 ms** | 3.93 ms → **3.95 ms** | 10 MiB → **5 MiB** |
| wasmJs | blur | 579 → **740** | 1.64 ms / 1.70 ms / 2.00 ms → **0.92 ms / 0.30 ms / 0.50 ms** | 5.26 ms → **4.53 ms** | 10 MiB → **4 MiB** |
| wasmJs | nested | 663 → **2177** | 1.43 ms / 1.40 ms / 1.60 ms → **0.39 ms / 0.40 ms / 0.50 ms** | 4.75 ms → **1.43 ms** | 11 MiB → **5 MiB** |
| wasmJs | perspective | 1657 → **1776** | 0.53 ms / 0.30 ms / 1.40 ms → **0.47 ms / 0.40 ms / 0.70 ms** | 1.25 ms → **1.93 ms** | 9 MiB → **4 MiB** |
| wasmJs | elevation | 850 → **956** | 1.12 ms / 1.00 ms / 1.70 ms → **0.45 ms / 0.40 ms / 0.50 ms** | 2.16 ms → **3.06 ms** | 9 MiB → **5 MiB** |
| wasmJs | shadows | 972 → **2398** | 0.98 ms / 0.90 ms / 1.60 ms → **0.27 ms / 0.30 ms / 0.40 ms** | 1.93 ms → **1.32 ms** | 9 MiB → **4 MiB** |
| wasmJs | cutshadows | 787 → **2485** | 1.24 ms / 1.30 ms / 1.70 ms → **0.25 ms / 0.30 ms / 0.40 ms** | 2.55 ms → **1.28 ms** | 10 MiB → **4 MiB** |
| wasmJs | cardscroll | 770 → **1619** | 1.18 ms / 1.10 ms / 1.80 ms → **0.38 ms / 0.40 ms / 0.60 ms** | 2.59 ms → **1.68 ms** | 12 MiB → **9 MiB** |
| wasmJs | blend | 320 → **2680** | 2.96 ms / 2.90 ms / 3.50 ms → **0.29 ms / 0.30 ms / 0.40 ms** | 8.79 ms → **1.14 ms** | 10 MiB → **4 MiB** |
| wasmJs | canvas | 665 → **1315** | 1.44 ms / 1.40 ms / 1.60 ms → **0.67 ms / 0.70 ms / 0.80 ms** | 2.29 ms → **1.79 ms** | 9 MiB → **4 MiB** |
| wasmJs | text | 37 → **2146** | 8.00 ms / 7.80 ms / 9.62 ms → **0.33 ms / 0.30 ms / 0.40 ms** | 9.86 ms → **1.05 ms** | 11 MiB → **4 MiB** |
| wasmJs | effects | 1097 → **3312** | 0.85 ms / 0.80 ms / 1.60 ms → **0.18 ms / 0.20 ms / 0.40 ms** | 1.83 ms → **1.11 ms** | 9 MiB → **4 MiB** |
| js | scroll | 1662 → **1615** | 0.36 ms / 0.30 ms / 0.80 ms → **0.35 ms / 0.30 ms / 0.80 ms** | 1.57 ms → **1.35 ms** | 33 MiB → **27 MiB** |
| js | layers | 207 → **475** | 4.57 ms / 4.50 ms / 5.20 ms → **1.90 ms / 1.90 ms / 2.20 ms** | 13 ms → **2.98 ms** | 24 MiB → **20 MiB** |
| js | fade | 758 → **2048** | 1.24 ms / 1.20 ms / 1.40 ms → **0.40 ms / 0.40 ms / 0.50 ms** | 3.85 ms → **1.24 ms** | 21 MiB → **17 MiB** |
| js | churn | 208 → **285** | 4.41 ms / 4.30 ms / 5.30 ms → **3.30 ms / 3.20 ms / 3.90 ms** | 7.68 ms → **4.67 ms** | 27 MiB → **25 MiB** |
| js | filters | 720 → **944** | 1.31 ms / 1.30 ms / 1.60 ms → **0.85 ms / 0.80 ms / 1.30 ms** | 4.30 ms → **4.43 ms** | 21 MiB → **17 MiB** |
| js | blur | 544 → **714** | 1.74 ms / 1.80 ms / 2.00 ms → **0.82 ms / 0.40 ms / 0.80 ms** | 5.74 ms → **4.83 ms** | 20 MiB → **15 MiB** |
| js | nested | 668 → **1639** | 1.41 ms / 1.40 ms / 1.77 ms → **0.51 ms / 0.50 ms / 0.70 ms** | 4.51 ms → **1.52 ms** | 21 MiB → **17 MiB** |
| js | perspective | 1773 → **1772** | 0.45 ms / 0.30 ms / 1.20 ms → **0.46 ms / 0.40 ms / 0.80 ms** | 1.31 ms → **1.94 ms** | 20 MiB → **16 MiB** |
| js | elevation | 1010 → **937** | 0.92 ms / 0.80 ms / 1.70 ms → **0.55 ms / 0.50 ms / 0.70 ms** | 2.19 ms → **3.28 ms** | 21 MiB → **17 MiB** |
| js | shadows | 1047 → **1771** | 0.92 ms / 0.80 ms / 1.60 ms → **0.39 ms / 0.40 ms / 0.50 ms** | 2.03 ms → **1.48 ms** | 21 MiB → **17 MiB** |
| js | cutshadows | 881 → **1879** | 1.00 ms / 0.90 ms / 1.70 ms → **0.37 ms / 0.40 ms / 0.50 ms** | 2.72 ms → **1.45 ms** | 21 MiB → **16 MiB** |
| js | cardscroll | 886 → **1205** | 0.96 ms / 0.90 ms / 1.70 ms → **0.53 ms / 0.50 ms / 1.00 ms** | 2.63 ms → **2.04 ms** | 29 MiB → **26 MiB** |
| js | blend | 310 → **2080** | 3.04 ms / 3.00 ms / 3.80 ms → **0.39 ms / 0.40 ms / 0.50 ms** | 10 ms → **1.25 ms** | 21 MiB → **17 MiB** |
| js | canvas | 522 → **942** | 1.87 ms / 1.80 ms / 2.10 ms → **0.94 ms / 0.90 ms / 1.10 ms** | 2.75 ms → **1.98 ms** | 19 MiB → **14 MiB** |
| js | text | 98 → **1369** | 9.68 ms / 9.50 ms / 12 ms → **0.54 ms / 0.50 ms / 0.70 ms** | 12 ms → **1.44 ms** | 26 MiB → **16 MiB** |
| js | effects | 1153 → **2687** | 0.78 ms / 0.70 ms / 1.30 ms → **0.23 ms / 0.20 ms / 0.40 ms** | 2.05 ms → **1.40 ms** | 19 MiB → **16 MiB** |
