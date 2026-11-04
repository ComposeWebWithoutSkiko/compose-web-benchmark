# Results in Chrome

Chrome/156.0.8078.80 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version).
Viewport 1280×800 CSS px at 2×. 2026-11-03T21:57:59.893Z.

Compose: upstream `1.13.0-beta01` against the fork's release `1.13.0-beta01-webcanvas.5`
(`076b062a2a8`). Built and measured with the sources of this repository; the raw results are not
kept here, `runner/run.mjs` measures them again. Upstream's frame rates vary more from run to run in
a few scenarios: `elevation` 648 to 763 frames per second on `wasmJs`, `cardscroll` 598 to 742,
`perspective` on `js` 1164 to 1364 (the fork 1456 to 1634); their CPU per frame varies less, e.g.
`elevation` on `wasmJs` 2.27 to 2.52 ms (the fork 2.99 to 3.00). For Safari, see
[safari.md](safari.md), for Firefox, [firefox.md](firefox.md), and with Haze, [haze.md](haze.md).

### Download size of the startup screen

| target | upstream (brotli) | Canvas 2D (brotli) | smaller by |
|---|---|---|---|
| wasmJs | 3081 KiB (10589 KiB raw) | 552 KiB (2103 KiB raw) | 5.6× |
| js | 3077 KiB (11613 KiB raw) | 634 KiB (3453 KiB raw) | 4.9× |

### Time to the first frame (median)

| target | load | upstream | Canvas 2D | faster by |
|---|---|---|---|---|
| wasmJs | first visit | 225 ms (n=10) | 78 ms (n=10) | 2.9× |
| wasmJs | repeat visit (HTTP and code caches) | 223 ms (n=10) | 76 ms (n=10) | 2.9× |
| wasmJs | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 3513 ms (n=5) | 1046 ms (n=5) | 3.4× |
| js | first visit | 448 ms (n=10) | 230 ms (n=10) | 1.9× |
| js | repeat visit (HTTP and code caches) | 448 ms (n=10) | 231 ms (n=10) | 1.9× |
| js | first visit, 4× slower CPU, 10 Mbit/s, 100 ms RTT | 4310 ms (n=5) | 1607 ms (n=5) | 2.7× |

### Animated scenarios (frame rate uncapped; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 2177 → **2949** | 0.31 ms / 0.20 ms / 0.80 ms → **0.20 ms / 0.20 ms / 0.40 ms** | 1.25 ms → **0.91 ms** | 13 MiB → **7 MiB** |
| wasmJs | layers | 232 → **825** | 4.09 ms / 3.70 ms / 6.00 ms → **1.06 ms / 1.10 ms / 1.20 ms** | 15 ms → **1.89 ms** | 12 MiB → **6 MiB** |
| wasmJs | fade | 736 → **2500** | 1.28 ms / 1.30 ms / 1.50 ms → **0.33 ms / 0.30 ms / 0.40 ms** | 3.77 ms → **1.11 ms** | 11 MiB → **4 MiB** |
| wasmJs | churn | 361 → **608** | 2.50 ms / 2.40 ms / 3.10 ms → **1.53 ms / 1.50 ms / 1.90 ms** | 4.72 ms → **2.31 ms** | 11 MiB → **10 MiB** |
| wasmJs | filters | 757 → **969** | 1.29 ms / 1.30 ms / 1.50 ms → **0.82 ms / 0.70 ms / 1.20 ms** | 3.75 ms → **4.03 ms** | 10 MiB → **4 MiB** |
| wasmJs | imagebrush | 771 → **4490** | 1.19 ms / 0.50 ms / 2.50 ms → **0.12 ms / 0.10 ms / 0.20 ms** | 1.86 ms → **0.68 ms** | 9 MiB → **11 MiB** |
| wasmJs | gradientbrush | 769 → **5659** | 1.22 ms / 0.50 ms / 2.50 ms → **0.12 ms / 0.10 ms / 0.20 ms** | 1.90 ms → **0.57 ms** | 9 MiB → **3 MiB** |
| wasmJs | compositebrush | 766 → **33** | 1.24 ms / 0.50 ms / 2.50 ms → **14 ms / 6.60 ms / 23 ms** | 1.95 ms → **93 ms** | 9 MiB → **4 MiB** |
| wasmJs | softlight | 452 → **5756** | 2.10 ms / 1.50 ms / 3.60 ms → **0.10 ms / 0.10 ms / 0.20 ms** | 5.84 ms → **0.57 ms** | 9 MiB → **3 MiB** |
| wasmJs | newcontent | 1609 → **5062** | 0.52 ms / 0.50 ms / 0.70 ms → **0.12 ms / 0.10 ms / 0.20 ms** | 1.59 ms → **0.69 ms** | 10 MiB → **7 MiB** |
| wasmJs | blur | 564 → **748** | 1.72 ms / 1.70 ms / 1.90 ms → **0.93 ms / 0.30 ms / 0.50 ms** | 5.46 ms → **4.37 ms** | 10 MiB → **3 MiB** |
| wasmJs | nested | 698 → **2154** | 1.37 ms / 1.40 ms / 1.50 ms → **0.40 ms / 0.40 ms / 0.50 ms** | 4.37 ms → **1.33 ms** | 10 MiB → **4 MiB** |
| wasmJs | perspective | 1165 → **1520** | 0.78 ms / 0.60 ms / 1.70 ms → **0.58 ms / 0.50 ms / 0.80 ms** | 1.50 ms → **1.84 ms** | 9 MiB → **3 MiB** |
| wasmJs | elevation | 733 → **976** | 1.32 ms / 1.50 ms / 1.70 ms → **0.43 ms / 0.40 ms / 0.50 ms** | 2.34 ms → **3.00 ms** | 10 MiB → **4 MiB** |
| wasmJs | shadows | 813 → **2634** | 1.16 ms / 1.10 ms / 1.60 ms → **0.24 ms / 0.20 ms / 0.30 ms** | 2.12 ms → **1.20 ms** | 9 MiB → **4 MiB** |
| wasmJs | cutshadows | 629 → **2371** | 1.55 ms / 1.60 ms / 1.80 ms → **0.29 ms / 0.30 ms / 0.40 ms** | 2.83 ms → **1.22 ms** | 10 MiB → **4 MiB** |
| wasmJs | cardscroll | 657 → **1839** | 1.36 ms / 1.50 ms / 1.70 ms → **0.34 ms / 0.30 ms / 0.50 ms** | 2.72 ms → **1.48 ms** | 12 MiB → **9 MiB** |
| wasmJs | cardlist | 1255 → **3276** | 0.63 ms / 0.40 ms / 1.60 ms → **0.18 ms / 0.20 ms / 0.30 ms** | 1.56 ms → **0.83 ms** | 12 MiB → **7 MiB** |
| wasmJs | blend | 334 → **2607** | 2.89 ms / 2.90 ms / 3.50 ms → **0.32 ms / 0.30 ms / 0.40 ms** | 8.12 ms → **1.08 ms** | 10 MiB → **4 MiB** |
| wasmJs | softlightlayers | 332 → **2492** | 2.91 ms / 2.90 ms / 3.50 ms → **0.33 ms / 0.30 ms / 0.40 ms** | 8.15 ms → **1.15 ms** | 10 MiB → **4 MiB** |
| wasmJs | canvas | 652 → **1389** | 1.44 ms / 1.40 ms / 1.70 ms → **0.63 ms / 0.60 ms / 0.70 ms** | 3.30 ms → **1.74 ms** | 9 MiB → **3 MiB** |
| wasmJs | text | 45 → **2240** | 7.65 ms / 7.60 ms / 8.80 ms → **0.32 ms / 0.30 ms / 0.40 ms** | 9.21 ms → **1.00 ms** | 11 MiB → **3 MiB** |
| wasmJs | effects | 788 → **3411** | 1.18 ms / 1.10 ms / 1.70 ms → **0.18 ms / 0.20 ms / 0.40 ms** | 2.18 ms → **1.06 ms** | 9 MiB → **3 MiB** |
| js | scroll | 1208 → **1873** | 0.59 ms / 0.40 ms / 1.70 ms → **0.30 ms / 0.20 ms / 0.60 ms** | 1.89 ms → **1.26 ms** | 32 MiB → **28 MiB** |
| js | layers | 219 → **488** | 4.38 ms / 4.30 ms / 4.90 ms → **1.84 ms / 1.80 ms / 2.00 ms** | 12 ms → **2.87 ms** | 25 MiB → **20 MiB** |
| js | fade | 773 → **1990** | 1.23 ms / 1.20 ms / 1.40 ms → **0.43 ms / 0.40 ms / 0.50 ms** | 3.76 ms → **1.25 ms** | 21 MiB → **17 MiB** |
| js | churn | 224 → **309** | 4.19 ms / 4.00 ms / 5.00 ms → **3.06 ms / 3.00 ms / 3.50 ms** | 7.03 ms → **4.18 ms** | 28 MiB → **26 MiB** |
| js | filters | 723 → **980** | 1.32 ms / 1.30 ms / 1.50 ms → **0.84 ms / 0.80 ms / 1.10 ms** | 4.15 ms → **4.16 ms** | 21 MiB → **17 MiB** |
| js | imagebrush | 770 → **2990** | 1.18 ms / 0.60 ms / 2.40 ms → **0.25 ms / 0.20 ms / 0.30 ms** | 2.00 ms → **0.86 ms** | 19 MiB → **14 MiB** |
| js | gradientbrush | 765 → **2895** | 1.23 ms / 0.60 ms / 2.40 ms → **0.28 ms / 0.30 ms / 0.40 ms** | 2.02 ms → **0.87 ms** | 19 MiB → **15 MiB** |
| js | compositebrush | 763 → **43** | 1.24 ms / 0.70 ms / 2.30 ms → **17 ms / 14 ms / 45 ms** | 2.09 ms → **74 ms** | 19 MiB → **14 MiB** |
| js | softlight | 449 → **2966** | 2.11 ms / 1.40 ms / 3.60 ms → **0.26 ms / 0.30 ms / 0.30 ms** | 6.04 ms → **0.86 ms** | 19 MiB → **14 MiB** |
| js | newcontent | 1591 → **3431** | 0.49 ms / 0.50 ms / 0.70 ms → **0.18 ms / 0.20 ms / 0.40 ms** | 1.78 ms → **0.88 ms** | 27 MiB → **24 MiB** |
| js | blur | 563 → **748** | 1.68 ms / 1.70 ms / 1.90 ms → **0.87 ms / 0.40 ms / 0.50 ms** | 5.45 ms → **4.45 ms** | 20 MiB → **16 MiB** |
| js | nested | 693 → **1655** | 1.37 ms / 1.40 ms / 1.50 ms → **0.53 ms / 0.50 ms / 0.60 ms** | 4.37 ms → **1.42 ms** | 21 MiB → **17 MiB** |
| js | perspective | 1299 → **1625** | 0.70 ms / 0.40 ms / 1.70 ms → **0.54 ms / 0.50 ms / 0.80 ms** | 1.45 ms → **1.77 ms** | 20 MiB → **16 MiB** |
| js | elevation | 669 → **973** | 1.42 ms / 1.60 ms / 1.70 ms → **0.53 ms / 0.50 ms / 0.60 ms** | 2.63 ms → **3.13 ms** | 21 MiB → **17 MiB** |
| js | shadows | 727 → **1962** | 1.30 ms / 1.40 ms / 1.60 ms → **0.36 ms / 0.40 ms / 0.40 ms** | 2.38 ms → **1.44 ms** | 21 MiB → **17 MiB** |
| js | cutshadows | 613 → **1827** | 1.56 ms / 1.60 ms / 1.70 ms → **0.40 ms / 0.40 ms / 0.50 ms** | 2.99 ms → **1.52 ms** | 21 MiB → **17 MiB** |
| js | cardscroll | 602 → **1327** | 1.40 ms / 1.60 ms / 1.70 ms → **0.48 ms / 0.40 ms / 0.90 ms** | 3.22 ms → **1.93 ms** | 29 MiB → **27 MiB** |
| js | cardlist | 1164 → **1952** | 0.64 ms / 0.40 ms / 1.70 ms → **0.28 ms / 0.20 ms / 0.60 ms** | 2.00 ms → **1.23 ms** | 31 MiB → **27 MiB** |
| js | blend | 324 → **1997** | 2.96 ms / 2.90 ms / 3.50 ms → **0.42 ms / 0.40 ms / 0.50 ms** | 9.29 ms → **1.24 ms** | 21 MiB → **17 MiB** |
| js | softlightlayers | 324 → **1980** | 2.96 ms / 2.90 ms / 3.50 ms → **0.43 ms / 0.40 ms / 0.50 ms** | 9.28 ms → **1.25 ms** | 21 MiB → **17 MiB** |
| js | canvas | 561 → **1029** | 1.73 ms / 1.70 ms / 1.80 ms → **0.88 ms / 0.90 ms / 1.00 ms** | 2.44 ms → **2.03 ms** | 20 MiB → **14 MiB** |
| js | text | 113 → **1620** | 8.60 ms / 8.60 ms / 11 ms → **0.47 ms / 0.50 ms / 0.60 ms** | 9.91 ms → **1.24 ms** | 27 MiB → **16 MiB** |
| js | effects | 758 → **3264** | 1.21 ms / 1.30 ms / 1.60 ms → **0.19 ms / 0.20 ms / 0.30 ms** | 2.28 ms → **1.16 ms** | 19 MiB → **16 MiB** |

### Text in 11 scripts with emoji (first visit, 10 s)

| target | build | first frame (median) | app download | fonts downloaded (median) |
|---|---|---|---|---|
| wasmJs | upstream | 187 ms (n=3) | 3082 KiB | 28 files, 1213 KiB, the last at 3777 ms |
| wasmJs | webcanvas | 71 ms (n=3) | 553 KiB | 0 files, 0 KiB |
| js | upstream | 360 ms (n=3) | 3077 KiB | 28 files, 1213 KiB, the last at 4073 ms |
| js | webcanvas | 178 ms (n=3) | 634 KiB | 0 files, 0 KiB |
