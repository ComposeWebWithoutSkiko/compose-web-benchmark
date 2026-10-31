package bench

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.ComposeViewport
import dev.chrisbanes.haze.HazeInput
import dev.chrisbanes.haze.HazePerformanceMode
import dev.chrisbanes.haze.HazeProgressive
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.blur.HazeBlurStyle
import dev.chrisbanes.haze.blur.HazeColorEffect
import dev.chrisbanes.haze.blur.hazeBlur
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState

private val STRIPES = listOf(Color(0xFFE53935), Color(0xFFFFEB3B), Color(0xFF43A047), Color(0xFF1E88E5))
private const val STRIPE_HEIGHT = 88f

/**
 * Panels of Haze over stripes that move in every frame, so that every panel blurs something new:
 * six of them with different styles, or a single frosted one for the `panel` scenario.
 */
fun main() {
    val scenario = queryParameter("scenario")
    ComposeViewport {
        val state = rememberHazeState()
        Box(Modifier.fillMaxSize().drawWithContent { drawContent(); reportFirstDraw() }) {
            Backdrop(state)
            Panel(state, 20, 20, frosted())
            if (scenario != "panel") {
                Panel(state, 380, 20, HazeBlurStyle { noiseFactor(0f) })
                Panel(
                    state,
                    740,
                    20,
                    HazeBlurStyle {
                        noiseFactor(0f)
                        progressive(HazeProgressive.verticalGradient())
                    },
                )
                Panel(
                    state,
                    20,
                    420,
                    HazeBlurStyle {
                        noiseFactor(0f)
                        mask(Brush.verticalGradient(listOf(Color.Black, Color.Transparent)))
                    },
                )
                Panel(
                    state,
                    380,
                    420,
                    HazeBlurStyle {
                        noiseFactor(0f)
                        backgroundColor(Color.Black.copy(alpha = 0.5f))
                        colorEffects(
                            listOf(
                                HazeColorEffect.tint(
                                    Brush.horizontalGradient(
                                        listOf(Color.Magenta.copy(alpha = 0.5f), Color.Cyan.copy(alpha = 0.5f)),
                                    ),
                                ),
                            ),
                        )
                    },
                )
                Panel(
                    state,
                    740,
                    420,
                    HazeBlurStyle {
                        noiseFactor(0f)
                        progressive(HazeProgressive.verticalGradient())
                    },
                    HazePerformanceMode.Quality,
                )
            }
        }
    }
}

/** The style of a panel of an app: a blur with a little noise, under a tint. */
private fun frosted() = HazeBlurStyle {
    noiseFactor(0.15f)
    colorEffects(listOf(HazeColorEffect.tint(Color.White.copy(alpha = 0.3f))))
}

/** Advances by the same step in every frame, like the scenarios of the app of the benchmark. */
@Composable
private fun Backdrop(state: HazeState) {
    var time by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(Unit) {
        while (true) {
            withFrameNanos {
                time += 1f / 60f
                countFrame()
            }
        }
    }
    Box(
        Modifier.fillMaxSize().hazeSource(state).drawBehind {
            val shift = (time * 2 * STRIPE_HEIGHT) % (STRIPES.size * STRIPE_HEIGHT)
            for (index in -STRIPES.size..(size.height / STRIPE_HEIGHT).toInt()) {
                drawRect(
                    color = STRIPES[(index + STRIPES.size) % STRIPES.size],
                    topLeft = Offset(0f, index * STRIPE_HEIGHT + shift),
                    size = Size(size.width, STRIPE_HEIGHT),
                )
            }
        },
    )
}

@Composable
private fun Panel(
    state: HazeState,
    x: Int,
    y: Int,
    style: HazeBlurStyle,
    performanceMode: HazePerformanceMode? = null,
) {
    Box(
        Modifier.offset(x.dp, y.dp)
            .size(340.dp, 340.dp)
            .hazeBlur(HazeInput.Sources(state), style, performanceMode),
    )
}
