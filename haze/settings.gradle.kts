pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
    }
}

dependencyResolutionManagement {
    repositories {
        // As in the app of the benchmark: see ../settings.gradle.kts.
        listOf(mavenLocal(), maven("https://repo.redlance.org/public")).forEach { repository ->
            repository.content { includeVersionByRegex("org\\.jetbrains\\.compose.*", ".*", ".*-webcanvas.*") }
        }
        mavenCentral()
        google()
    }
}

rootProject.name = "compose-web-benchmark-haze"

// The fork of Haze, which draws without Skia on the web, cloned next to this repository, as it is
// published for wasmJs only and this app also builds js. Upstream Compose takes Haze from Maven Central.
if (providers.gradleProperty("compose").orNull == "webcanvas") {
    includeBuild("../../haze") {
        dependencySubstitution {
            substitute(module("dev.chrisbanes.haze:haze")).using(project(":haze"))
            substitute(module("dev.chrisbanes.haze:haze-blur")).using(project(":haze-blur"))
            substitute(module("dev.chrisbanes.haze:haze-utils")).using(project(":haze-utils"))
        }
    }
}
