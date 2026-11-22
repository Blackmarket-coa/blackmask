import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The two web views load built-in placeholder pages unless pointed at real clients, for example
// ./gradlew assembleDebug -PpocChatUrl=https://chat.example -PpocVaultUrl=https://vault.example
val chatUrl = providers.gradleProperty("pocChatUrl").getOrElse("https://chat.poc.invalid/poc/chat.html")
val vaultUrl = providers.gradleProperty("pocVaultUrl").getOrElse("https://vault.poc.invalid/poc/vault.html")

android {
    namespace = "app.blackmask.poc"
    compileSdk = 36

    defaultConfig {
        applicationId = "app.blackmask.poc"
        minSdk = 30
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-poc"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "CHAT_URL", "\"$chatUrl\"")
        buildConfigField("String", "VAULT_URL", "\"$vaultUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("androidx.webkit:webkit:1.14.0")

    testImplementation("junit:junit:4.13.2")

    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
