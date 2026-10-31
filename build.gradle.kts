import org.jetbrains.kotlin.gradle.ExperimentalWasmDsl
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnPlugin
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnRootExtension
import org.jetbrains.kotlin.gradle.targets.wasm.yarn.WasmYarnPlugin
import org.jetbrains.kotlin.gradle.targets.wasm.yarn.WasmYarnRootExtension

plugins {
    kotlin("multiplatform") version "2.4.20"
    kotlin("plugin.compose") version "2.4.20"
    id("org.jetbrains.compose") version "1.13.0-beta01"
}

/**
 * Which Compose the app is built with: `upstream` (JetBrains' release, drawing with Skia) or
 * `webcanvas` (the same release drawing with Canvas 2D). Nothing else differs between the builds.
 */
val composeBuild = providers.gradleProperty("compose").getOrElse("upstream")
val composeVersion = when (composeBuild) {
    "upstream" -> "1.13.0-beta01"
    "webcanvas" -> "1.13.0-beta01-webcanvas.1"
    else -> error("Unknown -Pcompose=$composeBuild, expected upstream or webcanvas")
}

// The builds don't share outputs, so both stay ready to be served.
layout.buildDirectory = layout.projectDirectory.dir("build/$composeBuild")

// The builds have different npm dependencies, so each keeps its own locks. They must otherwise
// stay the same, so upgrade them together.
plugins.withType<YarnPlugin> {
    the<YarnRootExtension>().lockFileDirectory = file("kotlin-js-store/$composeBuild")
}
plugins.withType<WasmYarnPlugin> {
    the<WasmYarnRootExtension>().lockFileDirectory = file("kotlin-js-store/$composeBuild/wasm")
}

kotlin {
    js {
        browser { commonWebpackConfig { outputFileName = "app.js" } }
        binaries.executable()
    }
    @OptIn(ExperimentalWasmDsl::class)
    wasmJs {
        browser { commonWebpackConfig { outputFileName = "app.js" } }
        binaries.executable()
    }

    sourceSets {
        webMain.dependencies {
            implementation("org.jetbrains.compose.runtime:runtime:$composeVersion")
            implementation("org.jetbrains.compose.foundation:foundation:$composeVersion")
            implementation("org.jetbrains.compose.material3:material3:$composeVersion")
            implementation("org.jetbrains.compose.ui:ui:$composeVersion")
        }
    }
}
