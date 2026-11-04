# Results in Firefox

Firefox/159.0 on Apple M4 Pro (12 cores, 24 GB), darwin 24.6.0 arm64; GPU: Apple M1, or similar.
Viewport 1280×800 CSS px at 2×. 2026-11-03T22:46:06.328Z.

Compose: upstream `1.13.0-beta01` against the fork's release `1.13.0-beta01-webcanvas.5`
(`076b062a2a8`), the same builds as [chrome.md](chrome.md). Firefox draws at most 120 frames per
second here, so the CPU per frame of the tabs and the GPU process compares the builds where both
hold it. Firefox reads no JS heap. The raw results are not kept here, `runner/firefox.mjs` measures
them again; Firefox's own GPU string names the GPU. In Firefox the fork draws soft-light with a paint
as hard-light, which its accelerated Canvas 2D draws: the `softlight` row compares a different effect.
`perspective` varies on the fork: 119, 120 and 90 frames per second on `wasmJs`, 119, 88 and 119 on
`js`.

### Animated scenarios (frame rate 120; median of runs)

| target | scenario | frames/s | main thread per frame (mean / median / p95) | CPU per frame (page + GPU process) | JS heap + buffers |
|---|---|---|---|---|---|
| wasmJs | scroll | 120 → **120** | 1.29 ms / 1.00 ms / 3.00 ms → **1.27 ms / 1.00 ms / 3.00 ms** | 3.74 ms → **4.55 ms** | – → **–** |
| wasmJs | layers | 119 → **120** | 5.43 ms / 5.00 ms / 6.00 ms → **5.01 ms / 5.00 ms / 6.00 ms** | 15 ms → **5.95 ms** | – → **–** |
| wasmJs | fade | 120 → **120** | 1.04 ms / 1.00 ms / 2.00 ms → **1.66 ms / 1.00 ms / 3.00 ms** | 4.11 ms → **4.46 ms** | – → **–** |
| wasmJs | churn | 116 → **120** | 3.97 ms / 4.00 ms / 5.00 ms → **2.56 ms / 2.00 ms / 4.00 ms** | 6.90 ms → **6.75 ms** | – → **–** |
| wasmJs | filters | 120 → **120** | 1.11 ms / 1.00 ms / 2.00 ms → **0.64 ms / 1.00 ms / 1.00 ms** | 4.26 ms → **5.23 ms** | – → **–** |
| wasmJs | imagebrush | 120 → **120** | 1.64 ms / 2.00 ms / 3.00 ms → **0.72 ms / 1.00 ms / 2.00 ms** | 3.75 ms → **4.33 ms** | – → **–** |
| wasmJs | gradientbrush | 120 → **120** | 1.71 ms / 2.00 ms / 3.00 ms → **0.34 ms / 0.00 ms / 1.00 ms** | 3.70 ms → **4.56 ms** | – → **–** |
| wasmJs | compositebrush | 120 → **29** | 1.81 ms / 2.00 ms / 3.00 ms → **33 ms / 30 ms / 40 ms** | 3.72 ms → **40 ms** | – → **–** |
| wasmJs | softlight | 120 → **120** | 0.61 ms / 1.00 ms / 1.00 ms → **1.62 ms / 2.00 ms / 3.00 ms** | 5.89 ms → **4.44 ms** | – → **–** |
| wasmJs | newcontent | 120 → **120** | 1.34 ms / 1.00 ms / 3.00 ms → **1.40 ms / 1.00 ms / 3.00 ms** | 3.92 ms → **4.19 ms** | – → **–** |
| wasmJs | blur | 120 → **120** | 1.41 ms / 1.00 ms / 2.00 ms → **0.43 ms / 0.00 ms / 1.00 ms** | 4.99 ms → **4.32 ms** | – → **–** |
| wasmJs | nested | 120 → **120** | 1.11 ms / 1.00 ms / 2.00 ms → **1.62 ms / 1.00 ms / 3.00 ms** | 4.41 ms → **4.48 ms** | – → **–** |
| wasmJs | perspective | 120 → **119** | 1.79 ms / 2.00 ms / 4.00 ms → **4.36 ms / 3.00 ms / 14 ms** | 4.10 ms → **13 ms** | – → **–** |
| wasmJs | elevation | 120 → **45** | 1.96 ms / 2.00 ms / 4.00 ms → **0.95 ms / 1.00 ms / 2.00 ms** | 3.81 ms → **25 ms** | – → **–** |
| wasmJs | shadows | 120 → **120** | 1.92 ms / 2.00 ms / 4.00 ms → **0.53 ms / 1.00 ms / 1.00 ms** | 3.83 ms → **5.64 ms** | – → **–** |
| wasmJs | cutshadows | 120 → **120** | 1.99 ms / 2.00 ms / 4.00 ms → **0.45 ms / 0.00 ms / 1.00 ms** | 3.91 ms → **5.22 ms** | – → **–** |
| wasmJs | cardscroll | 120 → **120** | 1.86 ms / 2.00 ms / 4.00 ms → **0.71 ms / 1.00 ms / 1.00 ms** | 4.16 ms → **6.48 ms** | – → **–** |
| wasmJs | cardlist | 120 → **120** | 1.55 ms / 1.00 ms / 4.00 ms → **1.51 ms / 1.00 ms / 3.00 ms** | 3.92 ms → **4.60 ms** | – → **–** |
| wasmJs | blend | 120 → **120** | 0.98 ms / 1.00 ms / 2.00 ms → **1.51 ms / 1.00 ms / 3.00 ms** | 7.20 ms → **4.52 ms** | – → **–** |
| wasmJs | softlightlayers | 120 → **46** | 0.96 ms / 1.00 ms / 2.00 ms → **21 ms / 21 ms / 22 ms** | 7.22 ms → **22 ms** | – → **–** |
| wasmJs | canvas | 120 → **120** | 2.92 ms / 3.00 ms / 4.00 ms → **2.27 ms / 2.00 ms / 3.00 ms** | 4.20 ms → **5.38 ms** | – → **–** |
| wasmJs | text | 109 → **120** | 7.81 ms / 8.00 ms / 10 ms → **2.13 ms / 2.00 ms / 4.00 ms** | 9.23 ms → **4.22 ms** | – → **–** |
| wasmJs | effects | 120 → **120** | 1.74 ms / 1.00 ms / 4.00 ms → **0.37 ms / 0.00 ms / 1.00 ms** | 4.00 ms → **5.22 ms** | – → **–** |
| js | scroll | 120 → **120** | 1.47 ms / 1.00 ms / 4.00 ms → **1.55 ms / 1.00 ms / 4.00 ms** | 4.38 ms → **4.94 ms** | – → **–** |
| js | layers | 113 → **120** | 7.58 ms / 8.00 ms / 9.00 ms → **6.45 ms / 6.00 ms / 7.00 ms** | 17 ms → **7.51 ms** | – → **–** |
| js | fade | 120 → **120** | 1.16 ms / 1.00 ms / 2.00 ms → **2.00 ms / 2.00 ms / 4.00 ms** | 4.25 ms → **4.28 ms** | – → **–** |
| js | churn | 114 → **120** | 6.54 ms / 6.00 ms / 8.00 ms → **5.28 ms / 5.00 ms / 6.00 ms** | 9.84 ms → **9.52 ms** | – → **–** |
| js | filters | 120 → **120** | 1.29 ms / 1.00 ms / 2.00 ms → **0.91 ms / 1.00 ms / 2.00 ms** | 4.36 ms → **5.36 ms** | – → **–** |
| js | imagebrush | 120 → **120** | 2.07 ms / 2.00 ms / 4.00 ms → **1.16 ms / 1.00 ms / 3.00 ms** | 3.79 ms → **4.33 ms** | – → **–** |
| js | gradientbrush | 120 → **120** | 2.11 ms / 2.00 ms / 4.00 ms → **0.83 ms / 1.00 ms / 1.00 ms** | 3.69 ms → **4.66 ms** | – → **–** |
| js | compositebrush | 120 → **30** | 2.18 ms / 2.00 ms / 4.00 ms → **32 ms / 30 ms / 38 ms** | 3.74 ms → **41 ms** | – → **–** |
| js | softlight | 120 → **120** | 0.97 ms / 1.00 ms / 2.00 ms → **2.09 ms / 2.00 ms / 4.00 ms** | 6.14 ms → **4.24 ms** | – → **–** |
| js | newcontent | 120 → **120** | 1.37 ms / 1.00 ms / 3.00 ms → **1.64 ms / 1.00 ms / 4.00 ms** | 4.01 ms → **4.17 ms** | – → **–** |
| js | blur | 120 → **120** | 1.47 ms / 1.00 ms / 2.00 ms → **0.62 ms / 1.00 ms / 2.00 ms** | 5.19 ms → **4.19 ms** | – → **–** |
| js | nested | 120 → **120** | 1.31 ms / 1.00 ms / 2.00 ms → **1.91 ms / 2.00 ms / 4.00 ms** | 4.48 ms → **4.24 ms** | – → **–** |
| js | perspective | 120 → **119** | 1.99 ms / 2.00 ms / 4.00 ms → **4.65 ms / 3.00 ms / 14 ms** | 4.03 ms → **13 ms** | – → **–** |
| js | elevation | 120 → **51** | 2.07 ms / 2.00 ms / 3.00 ms → **1.31 ms / 1.00 ms / 2.00 ms** | 3.66 ms → **23 ms** | – → **–** |
| js | shadows | 120 → **120** | 2.04 ms / 2.00 ms / 4.00 ms → **0.73 ms / 1.00 ms / 1.00 ms** | 3.79 ms → **5.78 ms** | – → **–** |
| js | cutshadows | 120 → **120** | 2.07 ms / 2.00 ms / 3.00 ms → **0.75 ms / 1.00 ms / 1.00 ms** | 3.75 ms → **5.44 ms** | – → **–** |
| js | cardscroll | 120 → **120** | 1.87 ms / 2.00 ms / 4.00 ms → **1.12 ms / 1.00 ms / 2.00 ms** | 4.23 ms → **7.21 ms** | – → **–** |
| js | cardlist | 120 → **120** | 1.61 ms / 1.00 ms / 4.00 ms → **1.61 ms / 1.00 ms / 4.00 ms** | 4.50 ms → **4.82 ms** | – → **–** |
| js | blend | 120 → **120** | 1.08 ms / 1.00 ms / 2.00 ms → **1.81 ms / 2.00 ms / 4.00 ms** | 7.36 ms → **4.30 ms** | – → **–** |
| js | softlightlayers | 120 → **46** | 1.08 ms / 1.00 ms / 2.00 ms → **22 ms / 22 ms / 23 ms** | 7.35 ms → **22 ms** | – → **–** |
| js | canvas | 120 → **120** | 3.36 ms / 3.00 ms / 4.00 ms → **2.12 ms / 2.00 ms / 3.00 ms** | 4.54 ms → **5.21 ms** | – → **–** |
| js | text | 72 → **120** | 13 ms / 13 ms / 18 ms → **2.31 ms / 2.00 ms / 3.00 ms** | 15 ms → **4.29 ms** | – → **–** |
| js | effects | 120 → **120** | 1.82 ms / 1.00 ms / 4.00 ms → **0.58 ms / 1.00 ms / 1.00 ms** | 4.06 ms → **5.37 ms** | – → **–** |
