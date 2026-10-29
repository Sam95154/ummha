# MOMIN Android — Background Prayer Alarms + Full Makkah Azan

This Android Studio project wraps the existing live MOMIN website and adds native Android scheduling and audio playback. It reads location and prayer preferences from the WebView's storage and uses local calculations to schedule upcoming alarms for days ahead.

## Open and test
1. Install a current stable Android Studio release.
2. Open the android folder in Android Studio.
3. Let Gradle sync and dependencies download. Use JDK 17 if prompted.
4. Run on a real Android phone or emulator.
5. Inside the MOMIN app, open Settings → Location & Prayer Times, set and save a location/method, then open Notifications & Adhan and save notifications.
6. Allow notifications and Android's Alarms & reminders special access.
7. Keep MOMIN open for at least 15 seconds after saving settings to allow sync, then test with the screen locked and by swiping the app away (do not force-stop it).

## Notes
- Targets API 36; uses com.batoulapps.adhan:adhan:1.2.1.
- Chrome storage is separate from this app's WebView storage; settings must be saved inside the Android app.
- Exact-alarm access gives the best chance of on-time delivery. Without it, the app falls back to inexact alarms and full background Azan is not guaranteed.
- Battery management, DND, manufacturer restrictions, and force-stop may prevent or delay playback.
- Common method IDs are mapped to supported Adhan Java calculations. Less common method IDs fall back to Muslim World League; verify against the local mosque.
- This source has not been built with Android SDK/Gradle or device-tested yet.
- Confirm redistribution rights for the supplied recording before publishing it publicly.
- New Google Play submissions must target API 36 or higher as of 31 August 2026, subject to policy changes.
