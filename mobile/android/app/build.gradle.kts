plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android {
    namespace = "ca.qmaps.mobile"
    compileSdk = 36
    defaultConfig {
        applicationId = "ca.qmaps.mobile"
        testInstrumentationRunner = "ca.qmaps.mobile.test.JourneyInstrumentation"
        minSdk = 26
        targetSdk = 36
        versionCode = 4
        versionName = "1.0.0"
    }
    val store = System.getenv("QMAPS_UPLOAD_STORE_FILE")
    if (!store.isNullOrBlank()) {
        signingConfigs.create("owner") {
            storeFile = file(store)
            storePassword = System.getenv("QMAPS_UPLOAD_STORE_PASSWORD")
            keyAlias = System.getenv("QMAPS_UPLOAD_KEY_ALIAS")
            keyPassword = System.getenv("QMAPS_UPLOAD_KEY_PASSWORD")
        }
        buildTypes.getByName("release").signingConfig = signingConfigs.getByName("owner")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
kotlin { jvmToolchain(17) }
