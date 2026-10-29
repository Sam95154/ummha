plugins { id("com.android.application") }
android {
    namespace = "com.sam95154.momin"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.sam95154.momin"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
dependencies { implementation("com.batoulapps.adhan:adhan:1.2.1") }
