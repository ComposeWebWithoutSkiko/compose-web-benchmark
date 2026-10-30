@file:OptIn(ExperimentalWasmJsInterop::class)

package bench

import kotlin.js.ExperimentalWasmJsInterop
import kotlin.js.js

// The probes of index.html, which the runner reads. They are the same for both builds of Compose.

/** The value of the [name] query parameter of the page, if any. */
internal fun queryParameter(name: String): String? = js("new URLSearchParams(location.search).get(name)")

/** Tells the page that Compose has drawn its first frame. */
internal fun reportFirstDraw(): Unit = js("globalThis.__bench.onFirstDraw()")

/** Counts a frame of an animated scenario. */
internal fun countFrame(): Unit = js("globalThis.__bench.onFrame()")
