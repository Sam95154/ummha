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

## Native Android push notifications (Firebase Cloud Messaging)

The Android wrapper uses Capacitor 8 and the pinned `@capacitor/push-notifications@8.1.3` plugin. The plugin includes the Android Firebase Messaging dependency; do not manually add another Firebase Messaging SDK or Firebase Gradle dependency.

1. Download the Android app's `google-services.json` from Firebase for package ID `com.momin.noorulislam`.
2. Place it in the repository root beside `package.json`. It is intentionally ignored by Git and excluded from the generated `www/` web assets.
3. Run `npm install`, then `npm run android:prepare`. The preparation script copies the file into `android/app/google-services.json`, validates it exists, and generates the Android notification icon/channel metadata.
4. Build and install the debug APK on a physical Android device. Sign in, allow Android notifications, then enable notifications in MOMIN Settings. The device FCM token is submitted to the authenticated Supabase Edge Function; it is never written to browser logs or returned to the Admin UI.

### Supabase setup before Admin sends can deliver Android pushes

Apply `supabase/migrations/20261102000500_momin_native_fcm.sql`, deploy `momin-fcm-register`, and deploy the updated `momin-admin-api` function. The migration creates private token and send-audit tables with client access revoked.

In Firebase Project Settings → Cloud Messaging, enable the Firebase Cloud Messaging API (HTTP v1). Create or select a Google Cloud service account, grant it the **Firebase Cloud Messaging API Admin** role (`roles/firebasecloudmessaging.admin`) on project `momin-aefed`, then generate a JSON key. Store the entire JSON as the Supabase Edge Function secret `FCM_SERVICE_ACCOUNT_JSON`, and set `FCM_PROJECT_ID=momin-aefed`. Never commit or embed this service-account JSON in the Android app or Git repository. The credential is server-only.

Admin announcements continue to be written to the MOMIN user inbox. Android push delivery is sent only to active devices whose user has enabled announcements. The FCM sender uses high priority and a four-week TTL; an FCM accepted response means Google accepted the request, not that a device displayed it.

## Important release gate: notifications

The current web app registers browser Web Push through the service worker `momin-sw.js`. Standard Android WebView does not support service-worker push notifications. The web notification implementation is deliberately left unchanged, but it is not sufficient for the native Android build.

Before a public Play Store launch, complete the release gates above: apply the migration, deploy both updated Supabase functions, set the Firebase service-account secrets, build with the real `google-services.json`, and test foreground, background, terminated-app delivery, notification taps, and prayer reminders on real Android devices. The feature branch contains the implementation; production remains unchanged until review and deployment.

Location permissions are declared for prayer-time and Qibla features. Test the location prompt, denied-permission experience, and location refresh on a real device.

## Data and user protection

The Android build copies the existing user-facing web files into a generated `www/` folder. It does not alter Supabase tables, accounts, authentication records, or the deployed Render web app.
