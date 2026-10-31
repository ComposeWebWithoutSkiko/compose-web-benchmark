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

/** Which Compose and Haze the app is built with, as in the app of the benchmark. */
val composeBuild = providers.gradleProperty("compose").getOrElse("upstream")
val composeVersion = when (composeBuild) {
    "upstream" -> "1.13.0-beta01"
    "webcanvas" -> "1.13.0-beta01-webcanvas"
    else -> error("Unknown -Pcompose=$composeBuild, expected upstream or webcanvas")
}

// Next to the builds of the app of the benchmark, for the server of the runner.
layout.buildDirectory = layout.projectDirectory.dir("../build/$composeBuild-haze")

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
        webMain {
            // The probes and the page of the app of the benchmark.
            kotlin.srcDir("../src/webMain/kotlin/bench")
            kotlin.include("HazeMain.kt", "Probes.kt")
            resources.srcDir("../src/webMain/resources")
            dependencies {
                implementation("org.jetbrains.compose.runtime:runtime:$composeVersion")
                implementation("org.jetbrains.compose.foundation:foundation:$composeVersion")
                implementation("org.jetbrains.compose.ui:ui:$composeVersion")
                implementation("dev.chrisbanes.haze:haze:2.0.1")
                implementation("dev.chrisbanes.haze:haze-blur:2.0.1")
            }
        }
    }
}
