package bench

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Canvas as ImageCanvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.CompositeShader
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.ImageShader
import androidx.compose.ui.graphics.LinearGradientShader
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

// The scenarios. The animated ones do the same work in every frame, whatever the frame rate, and
// count their frames.

/**
 * The time of an animation at 60 frames per second, updated in every frame: reading it makes
 * whatever reads it (composition, layout, drawing or a layer) update in every frame.
 *
 * It advances by the same step however fast a build draws, so that all builds draw the same frames.
 * With the time of a clock, the faster a build, the smaller its change per frame, and what's rounded
 * (a width in pixels, a number in a text) wouldn't change in most of its frames.
 */
@Composable
private fun animationTime(): State<Float> {
    val time = remember { mutableFloatStateOf(0f) }
    EveryFrame { time.floatValue += 1f / 60f }
    return time
}

/** Scrolls [listState] by 16px in every frame and counts the frames. */
@Composable
private fun ScrollInEveryFrame(listState: LazyListState) {
    EveryFrame { listState.dispatchRawDelta(16f) }
}

/** Calls [onFrame] in every frame, and counts the frames. */
@Composable
private fun EveryFrame(onFrame: () -> Unit) {
    val currentOnFrame by rememberUpdatedState(onFrame)
    LaunchedEffect(Unit) {
        while (true) {
            withFrameNanos {
                currentOnFrame()
                countFrame()
            }
        }
    }
}

/** A value that goes from 0 to 1 and back for the card [index] at [time], each card a little after the one before. */
private fun wave(time: Float, index: Int): Float = abs(sin(time * 2f + index * 0.4f))

/** A typical screen of an app: a list of messages. [scrolling] scrolls it by 16px per frame. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun Inbox(scrolling: Boolean) {
    val listState = rememberLazyListState()
    if (scrolling) ScrollInEveryFrame(listState)
    Scaffold(
        topBar = { TopAppBar(title = { Text("Inbox") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = {}) { Text("+", fontSize = 24.sp) }
        },
    ) { padding ->
        LazyColumn(state = listState, contentPadding = padding) {
            items(if (scrolling) 100_000 else 50) { index ->
                Message(index)
                HorizontalDivider()
            }
        }
    }
}

@Composable
private fun Message(index: Int) {
    val sender = Senders[index % Senders.size]
    ListItem(
        supportingContent = {
            Text(
                Previews[(index * 7) % Previews.size],
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        },
        leadingContent = {
            Box(
                Modifier.size(40.dp).background(Palette[index % Palette.size], CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(sender.take(1), color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        trailingContent = {
            val minutes = ((index * 17) % 60).toString().padStart(2, '0')
            Text("${(index * 13) % 12 + 1}:$minutes", style = MaterialTheme.typography.labelSmall)
        },
    ) {
        Text(sender, maxLines = 1)
    }
}

/** Text in many scripts, with emoji: what the default fonts cover. */
@Composable
internal fun Languages() {
    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Greetings.forEach { Text(it, fontSize = 22.sp) }
    }
}

/** 400 boxes filling the screen, each its own layer, rotated, scaled and faded in every frame. */
@Composable
internal fun Layers() {
    val time by animationTime()
    Column(Modifier.padding(8.dp)) {
        repeat(16) { row ->
            Row {
                repeat(25) { column ->
                    val index = row * 25 + column
                    Box(
                        Modifier
                            .padding(4.dp)
                            .size(40.dp)
                            .graphicsLayer {
                                rotationZ = time * 90f + index * 7f
                                val scale = 0.75f + 0.25f * sin(time * 3f + index)
                                scaleX = scale
                                scaleY = scale
                                alpha = 0.4f + 0.6f * abs(sin(time * 2f + index * 0.3f))
                            }
                            .background(Palette[index % Palette.size], RoundedCornerShape(10.dp))
                    )
                }
            }
        }
    }
}

// Layers that need an offscreen buffer in every frame: cards of several draws (a background and a
// text), each a layer that changes in every frame.

/** A card: a background of [shape] and [label], drawn through [labelModifier]. */
@Composable
private fun Card(
    index: Int,
    modifier: Modifier,
    shape: Shape = CardShape,
    label: String = "Card ${index + 1}",
    labelModifier: Modifier = Modifier,
) {
    Box(modifier.background(Palette[index % Palette.size], shape)) {
        Text(label, labelModifier.padding(12.dp), color = Color.White, fontWeight = FontWeight.Bold)
    }
}

private val CardShape = RoundedCornerShape(12.dp)

/** Where a card of a grid goes: 196 x 60 dp, 6 dp from the next ones. */
private val CardSlot = Modifier.padding(6.dp).size(196.dp, 60.dp)

/** [rows] x [columns] items, numbered row by row. */
@Composable
private fun Grid(rows: Int, columns: Int, modifier: Modifier = Modifier, item: @Composable (index: Int) -> Unit) {
    Column(modifier) {
        repeat(rows) { row ->
            Row {
                repeat(columns) { column -> item(row * columns + column) }
            }
        }
    }
}

/** [rows] x [columns] cards made by [card], numbered row by row. */
@Composable
private fun Cards(rows: Int = 10, columns: Int = 6, card: @Composable (index: Int) -> Unit) {
    Grid(rows, columns, Modifier.padding(8.dp), card)
}

/** [rows] x [columns] cards, each a layer set up by [layer] in every frame. */
@Composable
private fun CardGrid(
    rows: Int = 10,
    columns: Int = 6,
    layer: GraphicsLayerScope.(index: Int) -> Unit,
) {
    Cards(rows, columns) { index -> Card(index, CardSlot.graphicsLayer { layer(index) }) }
}

/** 60 cards fading in and out: an alpha that can't be applied draw by draw. */
@Composable
internal fun Fade() {
    val time by animationTime()
    CardGrid { index -> alpha = 0.3f + 0.7f * wave(time, index) }
}

/**
 * 60 cards that fade, move by fractions of pixels and show a number and a bar that change in every
 * frame: offscreen layers whose position and content change in every frame, so that nothing drawn
 * for a frame can be used again in the next one.
 */
@Composable
internal fun Churn() {
    val time by animationTime()
    Cards { index ->
        Box(
            CardSlot
                .graphicsLayer {
                    alpha = 0.3f + 0.7f * wave(time, index)
                    translationX = sin(time * 3f + index) * 6.3f * density
                    translationY = cos(time * 2f + index) * 4.7f * density
                }
                .drawBehind {
                    drawRoundRect(Palette[index % Palette.size], cornerRadius = CornerRadius(12.dp.toPx()))
                    val fraction = (time * 0.5f + index * 0.05f) % 1f
                    drawRect(Color.White.copy(alpha = 0.35f), size = Size(size.width * fraction, size.height))
                }
                .padding(12.dp)
        ) {
            Text(
                "${index + 1}: ${((time * 60).toInt() + index) % 1000}",
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

/** The saturation of 60 cards going down and up, through color matrices (16 levels). */
@Composable
internal fun Filters() {
    val time by animationTime()
    val filters = remember { saturationFilters() }
    CardGrid { index ->
        colorFilter = filters[saturationLevel(time, index)]
    }
}

/** The 16 levels of saturation of the cards, from gray to the colors as they are. */
private fun saturationFilters(): List<ColorFilter> =
    List(16) { level -> ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(level / 15f) }) }

/** The level of saturation of the card [index] at [time], going down and up. */
private fun saturationLevel(time: Float, index: Int): Int = (wave(time, index) * 15).toInt()

/**
 * 60 cards filled with a tiled image whose saturation goes down and up (see [BrushCards]): an image
 * shader through a color filter.
 */
@Composable
internal fun ImageBrush() {
    BrushCards(remember { checkerBrush() })
}

/**
 * 60 cards filled with a gradient whose saturation goes down and up (see [BrushCards]): a gradient
 * through a color filter.
 */
@Composable
internal fun GradientBrush() {
    BrushCards(remember { Brush.linearGradient(Palette) })
}

/**
 * 60 cards filled with a blend of two gradients whose saturation goes down and up (see
 * [BrushCards]): a shader that no fill style draws, through a color filter.
 */
@Composable
internal fun CompositeBrush() {
    BrushCards(
        remember {
            object : ShaderBrush() {
                override fun createShader(size: Size): Shader = CompositeShader(
                    LinearGradientShader(Offset.Zero, Offset(size.width, 0f), Palette),
                    LinearGradientShader(Offset.Zero, Offset(0f, size.height), listOf(Color.White, Color.DarkGray)),
                    BlendMode.Multiply,
                )
            }
        }
    )
}

/**
 * 60 cards with a tiled image drawn over them in soft-light with a paint, its alpha going down and
 * up: a blend mode that Firefox's accelerated Canvas 2D doesn't draw, reading the canvas back for it.
 * Haze blends its noise in soft-light through a render effect instead, which the panels of the Haze
 * app measure (`haze/`).
 */
@Composable
internal fun SoftLight() {
    val time by animationTime()
    val noise = remember { checkerBrush() }
    DrawnCards { index ->
        drawRect(Palette[index % Palette.size])
        drawRect(noise, alpha = 0.3f + 0.7f * wave(time, index), blendMode = BlendMode.Softlight)
    }
}

/**
 * The frames in which the texts of [NewContent] are new: past the frames by which the page of the
 * emote catalog of Emotecraft Library was taken off acceleration as its content came, its 37th, 65th
 * or 91st in Firefox 159 (see `AtlasPage` in compose-multiplatform-core).
 */
private const val NewContentFrames = 120

/**
 * A list of cards whose texts, each in an offscreen layer as large as its card, are new in each of
 * its first 120 frames, as the content of an app coming after its start, then scrolled by 16px per
 * frame: Firefox takes a canvas off acceleration for good once too many of its frames missed its
 * caches, as the canvas the layers are drawn into does in those frames, where all it draws is new
 * text.
 */
@Composable
internal fun NewContent() {
    val listState = rememberLazyListState()
    val frame = remember { mutableIntStateOf(0) }
    EveryFrame { if (frame.intValue < NewContentFrames) frame.intValue++ else listState.dispatchRawDelta(16f) }
    LazyColumn(state = listState, modifier = Modifier.fillMaxSize()) {
        items(100_000) { index ->
            Card(
                index,
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp).height(64.dp),
                label = if (frame.intValue < NewContentFrames) "Card ${index + 1}, frame ${frame.intValue}" else "Card ${index + 1}",
                labelModifier = Modifier.fillMaxSize().graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen },
            )
        }
    }
}

/** 60 cards filled with [brush], whose saturation goes down and up, through color matrices (16 levels). */
@Composable
private fun BrushCards(brush: Brush) {
    val time by animationTime()
    val filters = remember { saturationFilters() }
    DrawnCards { index -> drawRect(brush, colorFilter = filters[saturationLevel(time, index)]) }
}

/** 60 cards, each drawn by [draw] with its index. */
@Composable
private fun DrawnCards(draw: DrawScope.(index: Int) -> Unit) {
    Cards { index -> Box(CardSlot.drawBehind { draw(index) }) }
}

/** A 16 x 16 tile of four colors of the palette, repeated. */
private fun checkerBrush(): Brush {
    val tile = ImageBitmap(16, 16)
    val canvas = ImageCanvas(tile)
    for (i in 0 until 4) {
        val x = (i % 2) * 8f
        val y = (i / 2) * 8f
        canvas.drawRect(x, y, x + 8f, y + 8f, Paint().apply { color = Palette[i] })
    }
    return ShaderBrush(ImageShader(tile, TileMode.Repeated, TileMode.Repeated))
}

/** 24 cards blurred by a changing radius, every other one with its edges clamped. */
@Composable
internal fun Blur() {
    val time by animationTime()
    CardGrid(rows = 4) { index ->
        val radius = (2f + 6f * wave(time, index)) * density
        renderEffect = BlurEffect(radius, radius, if (index % 2 == 0) TileMode.Clamp else TileMode.Decal)
    }
}

/** 10 groups of 6 cards, the groups and the cards fading: offscreen layers in offscreen layers. */
@Composable
internal fun Nested() {
    val time by animationTime()
    Grid(rows = 5, columns = 2, Modifier.padding(8.dp)) { group ->
        val groupModifier = Modifier
            .padding(4.dp)
            .graphicsLayer { alpha = 0.5f + 0.5f * abs(sin(time + group)) }
            .background(Color(0x22000000), RoundedCornerShape(16.dp))
            .padding(4.dp)
        Grid(rows = 2, columns = 3, groupModifier) { card ->
            val index = group * 6 + card
            Card(
                index,
                Modifier
                    .padding(4.dp)
                    .size(196.dp, 56.dp)
                    .graphicsLayer { alpha = 0.4f + 0.6f * wave(time, index) },
            )
        }
    }
}

/** 24 cards turning around their vertical axis: layers in perspective. */
@Composable
internal fun Perspective() {
    val time by animationTime()
    CardGrid(rows = 4) { index ->
        rotationY = sin(time * 2f + index * 0.3f) * 60f
        cameraDistance = 8f * density
    }
}

/** 60 cards whose elevation changes, so their shadows change in every frame. */
@Composable
internal fun Elevation() {
    val time by animationTime()
    CardGrid { index ->
        shadowElevation = (2f + 10f * abs(sin(time * 2f + index * 0.3f))) * density
        shape = RoundedCornerShape(12.dp)
        clip = true
    }
}

/**
 * 60 cards with shadows that stay as they are, under a bar that grows in every frame: frames that
 * draw the same shadows again. With [cutCorners], the shadows are of paths rather than of rounded
 * rectangles.
 */
@Composable
internal fun Shadows(cutCorners: Boolean) {
    val time by animationTime()
    val shape = if (cutCorners) CutCornerShape(12.dp) else CardShape
    Column(Modifier.padding(8.dp)) {
        Box(
            Modifier.padding(6.dp).fillMaxWidth().height(4.dp).drawBehind {
                drawRect(Palette[0], size = Size(size.width * (time * 0.5f % 1f), size.height))
            }
        )
        Grid(rows = 10, columns = 6) { index ->
            Card(index, CardSlot.shadow(6.dp, shape), shape)
        }
    }
}

/** Rows of 6 cards with shadows, scrolled by 16px per frame: the same shadows, moved. */
@Composable
internal fun CardScroll() {
    val listState = rememberLazyListState()
    ScrollInEveryFrame(listState)
    LazyColumn(state = listState, contentPadding = PaddingValues(8.dp)) {
        items(100_000) { row ->
            Row {
                repeat(6) { column ->
                    Card(row * 6 + column, CardSlot.shadow(6.dp, CardShape))
                }
            }
        }
    }
}

/**
 * The messages of the inbox in a card with rounded corners, scrolled by 16px per frame: list items
 * whose backgrounds reach the edges of the card's clip, between their texts.
 */
@Composable
internal fun CardList() {
    val listState = rememberLazyListState()
    ScrollInEveryFrame(listState)
    Surface(
        Modifier.fillMaxSize().padding(24.dp),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
    ) {
        LazyColumn(state = listState) {
            items(100_000) { index ->
                Message(index)
                HorizontalDivider()
            }
        }
    }
}

/**
 * 60 fading cards blended onto a gradient in [blendMode], a blend mode of their layers: one that needs
 * an offscreen layer, such as multiply; in soft-light, which Firefox's accelerated Canvas 2D doesn't
 * draw, compositing a layer reads the canvas back there.
 */
@Composable
internal fun Blend(blendMode: BlendMode) {
    val time by animationTime()
    Box(Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Palette[3], Palette[7], Palette[5])))) {
        CardGrid { index ->
            alpha = 0.6f + 0.4f * wave(time, index)
            this.blendMode = blendMode
        }
    }
}

/** 1500 circles, rectangles and lines and 100 stars, all moving, drawn in every frame. */
@Composable
internal fun Shapes() {
    val time by animationTime()
    val star = remember { Path() }
    Canvas(Modifier.fillMaxSize()) {
        val t = time
        for (i in 0 until 1500) {
            val x = (i * 73 % 997) / 997f * size.width + sin(t * 2f + i) * 24f
            val y = (i * 151 % 991) / 991f * size.height + cos(t * 3f + i) * 24f
            val color = Palette[i % Palette.size]
            when (i % 3) {
                0 -> drawCircle(color, radius = 6f + i % 9, center = Offset(x, y))
                1 -> drawRect(color, topLeft = Offset(x, y), size = Size(14f, 9f + i % 7))
                else -> drawLine(color, Offset(x, y), Offset(x + 30f, y + 12f), strokeWidth = 2f)
            }
        }
        for (i in 0 until 100) {
            val cx = (i * 211 % 983) / 983f * size.width
            val cy = (i * 307 % 977) / 977f * size.height
            star.reset()
            for (point in 0 until 10) {
                val angle = t + point * PI.toFloat() / 5f
                val radius = if (point % 2 == 0) 28f else 12f
                val px = cx + cos(angle) * radius
                val py = cy + sin(angle) * radius
                if (point == 0) star.moveTo(px, py) else star.lineTo(px, py)
            }
            star.close()
            if (i % 2 == 0) {
                drawPath(star, Palette[i % Palette.size])
            } else {
                drawPath(star, Palette[i % Palette.size], style = Stroke(width = 3f))
            }
        }
    }
}

/** 12 styled paragraphs whose widths change in every frame, so they are laid out again. */
@Composable
internal fun Reflow() {
    val time by animationTime()
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        StyledParagraphs.forEachIndexed { index, paragraph ->
            Text(
                paragraph,
                Modifier.layout { measurable, constraints ->
                    val fraction = 0.55f + 0.45f * abs(sin(time * 1.5f + index))
                    val width = (constraints.maxWidth * fraction).toInt()
                    val placeable = measurable.measure(constraints.copy(minWidth = 0, maxWidth = width))
                    layout(constraints.maxWidth, placeable.height) { placeable.place(0, 0) }
                },
                fontSize = 14.sp,
            )
        }
    }
}

/** 40 cards with shadows and gradients under a blurred circle that moves in every frame. */
@Composable
internal fun Effects() {
    val time by animationTime()
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.padding(12.dp)) {
            repeat(5) { row ->
                Row {
                    repeat(8) { column ->
                        val index = row * 8 + column
                        val shape = RoundedCornerShape(16.dp)
                        Box(
                            Modifier
                                .padding(12.dp)
                                .size(130.dp, 90.dp)
                                .shadow(8.dp, shape)
                                .background(
                                    Brush.linearGradient(
                                        listOf(Palette[index % Palette.size], Palette[(index + 3) % Palette.size])
                                    ),
                                    shape,
                                )
                        )
                    }
                }
            }
        }
        Box(
            Modifier
                .align(Alignment.Center)
                .size(280.dp)
                .graphicsLayer {
                    translationX = sin(time) * 300f
                    translationY = cos(time * 0.7f) * 120f
                    val radius = 30f + 20f * sin(time * 2f)
                    renderEffect = BlurEffect(radius, radius, TileMode.Decal)
                }
                .background(Color(0x99E040FB), CircleShape)
        )
    }
}

private val Palette = listOf(
    Color(0xFF6750A4), Color(0xFF00897B), Color(0xFFE53935), Color(0xFFFB8C00),
    Color(0xFF3949AB), Color(0xFF43A047), Color(0xFF8E24AA), Color(0xFF00ACC1),
)

private val Senders = listOf(
    "Ada Lovelace", "Alan Turing", "Grace Hopper", "Edsger Dijkstra", "Barbara Liskov",
    "Donald Knuth", "Margaret Hamilton", "Ken Thompson", "Frances Allen", "Dennis Ritchie",
    "Radia Perlman", "John McCarthy", "Leslie Lamport", "Sophie Wilson", "Niklaus Wirth",
)

private val Previews = listOf(
    "Can we move the design review to Thursday? The new mockups are not ready yet.",
    "Here are the numbers from last week. Conversion is up by 4% since the redesign shipped.",
    "Reminder: the office is closed on Monday. Please submit your timesheets by Friday noon.",
    "I pushed a fix for the crash on startup, could you take a look before the release?",
    "Thanks for the great talk yesterday! Would you share the slides with the team?",
    "The build is green again. The flaky test was waiting for an animation to finish.",
    "Lunch at 1pm? There is a new place around the corner that everyone keeps talking about.",
    "Your order has shipped and will arrive in 2-3 business days. Track it in the app.",
    "We are planning the offsite for next month. Fill in the form with your availability.",
    "Attached is the contract draft. Legal asked for changes to sections 4 and 7.",
    "Quick question about the API: should the endpoint return 404 or an empty list?",
)

private val Greetings = listOf(
    "Hello, world! The quick brown fox jumps over the lazy dog.",
    "Привет, мир! Съешь же ещё этих мягких французских булок.",
    "Γειά σου κόσμε! Ξεσκεπάζω την ψυχοφθόρα βδελυγμία.",
    "مرحبا بالعالم! نص عربي من اليمين إلى اليسار.",
    "שלום עולם! טקסט בעברית מימין לשמאל.",
    "नमस्ते दुनिया! यह हिंदी में लिखा गया है।",
    "你好，世界！敏捷的棕色狐狸跳过了懒狗。",
    "こんにちは世界！いろはにほへと ちりぬるを。",
    "안녕하세요 세계! 다람쥐 헌 쳇바퀴에 타고파.",
    "สวัสดีชาวโลก! ภาษาไทยไม่มีช่องว่างระหว่างคำ",
    "Emoji: 😀 🎉 🚀 ❤️ 👍 🍕 🌍 🔥 ✨ 🐱",
)

private val StyledParagraphs = List(12) { index ->
    buildAnnotatedString {
        append("Paragraph ${index + 1}. ")
        withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
            append("Compose lays this text out again in every frame, ")
        }
        append("because its width changes with the animation. Each line is broken at word boundaries, ")
        withStyle(SpanStyle(fontStyle = FontStyle.Italic, color = Palette[index % Palette.size])) {
            append("and the styled spans keep their colors and slants across the line breaks, ")
        }
        append("while the paragraph measures its height and the column places it below the previous one. ")
        withStyle(SpanStyle(fontSize = 18.sp)) { append("Larger words ") }
        append("change the height of the lines they are on.")
    }
}
