pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
    }
}

dependencyResolutionManagement {
    repositories {
        // The Canvas 2D build of Compose: a local build of it, or the published one. Only its
        // versions are taken from these, so the upstream build always comes from Maven Central.
        listOf(mavenLocal(), maven("https://repo.redlance.org/public")).forEach { repository ->
            repository.content { includeVersionByRegex("org\\.jetbrains\\.compose.*", ".*", ".*-webcanvas.*") }
        }
        mavenCentral()
        google()
    }
}

rootProject.name = "compose-web-benchmark"
