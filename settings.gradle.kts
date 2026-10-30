pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
    }
}

dependencyResolutionManagement {
    repositories {
        // The Canvas 2D build of Compose, published by
        // `./gradlew :mpp:publishComposeJbToMavenLocal` in ComposeWebWithoutSkiko/compose-multiplatform-core
        // (see README.md). Only its version is taken from here, so the upstream build always comes
        // from Maven Central.
        mavenLocal {
            content { includeVersionByRegex("org\\.jetbrains\\.compose.*", ".*", ".*-webcanvas") }
        }
        mavenCentral()
        google()
    }
}

rootProject.name = "compose-web-benchmark"
