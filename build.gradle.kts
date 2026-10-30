import org.jetbrains.kotlin.gradle.ExperimentalWasmDsl

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
    "webcanvas" -> "1.13.0-beta01-webcanvas"
    else -> error("Unknown -Pcompose=$composeBuild, expected upstream or webcanvas")
}

// The builds don't share outputs, so both stay ready to be served.
layout.buildDirectory = layout.projectDirectory.dir("build/$composeBuild")

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
