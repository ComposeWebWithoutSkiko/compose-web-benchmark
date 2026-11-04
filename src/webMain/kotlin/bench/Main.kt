package bench

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.window.ComposeViewport

/** The app: the scenario named by the `scenario` query parameter, `startup` by default. */
fun main() {
    val scenario = queryParameter("scenario") ?: "startup"
    ComposeViewport { Bench(scenario) }
}

@Composable
private fun Bench(scenario: String) {
    MaterialTheme {
        Surface(Modifier.fillMaxSize().drawWithContent { drawContent(); FirstDraw.report() }) {
            when (scenario) {
                "startup" -> Inbox(scrolling = false)
                "scroll" -> Inbox(scrolling = true)
                "i18n" -> Languages()
                "layers" -> Layers()
                "fade" -> Fade()
                "churn" -> Churn()
                "filters" -> Filters()
                "imagebrush" -> ImageBrush()
                "gradientbrush" -> GradientBrush()
                "compositebrush" -> CompositeBrush()
                "softlight" -> SoftLight()
                "newcontent" -> NewContent()
                "blur" -> Blur()
                "nested" -> Nested()
                "perspective" -> Perspective()
                "elevation" -> Elevation()
                "shadows" -> Shadows(cutCorners = false)
                "cutshadows" -> Shadows(cutCorners = true)
                "cardscroll" -> CardScroll()
                "cardlist" -> CardList()
                "blend" -> Blend(BlendMode.Multiply)
                "softlightlayers" -> Blend(BlendMode.Softlight)
                "canvas" -> Shapes()
                "text" -> Reflow()
                "effects" -> Effects()
                else -> Text("Unknown scenario: $scenario")
            }
        }
    }
}

private object FirstDraw {
    private var isReported = false

    fun report() {
        if (isReported) return
        isReported = true
        reportFirstDraw()
    }
}
