# MOMIN Android preparation

This repository keeps the existing MOMIN web app as the source of truth. The Android wrapper is generated with Capacitor; the Render website files and Supabase user data are not migrated or replaced.

## Android identity

- App name: MOMIN
- Android application ID: com.momin.noorulislam
- Android target SDK: 36 (Android 16)
- Web app entry point: existing root index.html, copied into www/ only for Android builds
- Native wrapper: Capacitor 8.5.3

The application ID becomes the permanent Play Store identity after the first Play Store release. Confirm it before creating the Play Console listing or Firebase Android app.

## Build locally

Requirements: Node.js 22, Java 21, Android Studio with Android SDK Platform 36 and Build Tools 36.0.0.

```bash
npm install
npm run android:prepare
npm run android:debug
```

To generate an unsigned release bundle:

```bash
npm run android:bundle
```

The outputs are:

- Debug APK: android/app/build/outputs/apk/debug/
- Release AAB: android/app/build/outputs/bundle/release/

The release AAB is unsigned by default. A persistent upload key must be created and kept securely by the app owner, then configured in Android Studio or the release build pipeline before uploading to Play Console. Do not commit a keystore or signing passwords to Git.

## Google sign-in redirect

The Android build uses this app link:

`com.momin.noorulislam://auth/callback`

Add this exact value to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. The existing website redirect remains unchanged. Google sign-in must then be tested on a physical Android device.

## Important release gate: notifications

The current web app registers browser Web Push through the service worker `momin-sw.js`. Standard Android WebView does not support service-worker push notifications. The web notification implementation is deliberately left unchanged, but it is not sufficient for the native Android build.

Before a public Play Store launch, implement native Android push notifications using Firebase Cloud Messaging (FCM), add the matching `google-services.json` for this application ID, and adapt the Supabase notification sender to deliver FCM messages. Test foreground, background, terminated-app delivery, notification taps, and prayer reminders on real Android devices.

Location permissions are declared for prayer-time and Qibla features. Test the location prompt, denied-permission experience, and location refresh on a real device.

## Data and user protection

The Android build copies the existing user-facing web files into a generated `www/` folder. It does not alter Supabase tables, accounts, authentication records, or the deployed Render web app.
