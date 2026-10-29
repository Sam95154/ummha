# MOMIN Android — Background Prayer Alarms + Makkah Azan

This Android Studio project wraps the existing live MOMIN web interface and adds native Android scheduling, alarm diagnostics, and audio playback. The source is on the separate \`android-background-azan\` branch under \`android/\`; it does not change the Render website on \`noor-ul-islam-live\`.

## Open and test
1. Install Android Studio.
2. Open PowerShell at the repository root and run:

\`\`\`powershell
Set-Location .\android
powershell -ExecutionPolicy Bypass -File .\setup-gradle-wrapper.ps1
\`\`\`

The script downloads Gradle 8.13 and generates the wrapper files. It does not install or publish MOMIN.
3. Open the \`android/\` folder in Android Studio, sync Gradle, and use JDK 17 if prompted.
4. Run on a real Android phone or emulator.
5. Inside MOMIN, save your location and calculation method in **Settings → Location & Prayer Times**, then select **Makkah Azan ringtone** and save notification settings in **Notifications & Adhan**.
6. Allow notification permission and Android's **Alarms & reminders** special access.
7. Keep MOMIN open for about 15 seconds after saving settings. Tap the floating **Azan tools** control to view native permission/scheduler status, refresh alarms, or test Azan playback.
8. Test with the screen locked and by swiping MOMIN away from Recents. Do not force-stop it during testing.

## Included
- Android app shell that loads https://noor-ul-islam-dua.onrender.com/.
- Syncs location, common prayer calculation method, Asr method, per-prayer toggles, lead time, and sound mode from the WebView's own storage.
- Calculates a rolling eight-day schedule locally using Adhan Java.
- Schedules Android alarms, using exact alarms when special access is granted and an inexact fallback otherwise.
- Reschedules after reboot, time/time-zone changes, app replacement, and exact-alarm permission changes.
- Uses a native media-playback foreground service to play the supplied MP3 when a prayer alarm fires.
- Shows a persistent playback notification with a **Stop Azan** action.
- Includes an **Azan tools** panel showing notification permission, exact-alarm access, stored location, sound mode, per-prayer state, scheduled alarm count, and next scheduled alarm. It also offers a native Azan test and links to system settings.

## Notes and limitations
- Chrome localStorage is separate from the Android app's WebView storage. Save settings from inside MOMIN on the phone.
- Granting **Alarms & reminders** gives the best chance of on-time delivery. Without it, Android may delay an alarm and may restrict background service startup.
- Battery management, Do Not Disturb, manufacturer restrictions, notification permission denial, and force-stop may prevent or delay playback.
- Common calculation-method IDs are mapped to supported Adhan Java methods; some provider-specific methods fall back to Muslim World League. Confirm timing and method against the local mosque.
- A GitHub Actions debug build succeeded for commit \`fb92311dd9cfa0688d7fa6a9b47a8c99367850a3\`. It has not yet been tested on a physical phone. Validate locked-screen and swiped-away behavior before relying on it or preparing a release.
- The supplied recording is the user's provided MP3 (about 29 seconds). Confirm redistribution rights before a public Play Store release.
- Google Play new-app target requirements can change; this project currently targets API 36. Check current Play Console requirements before release.

References:
- https://developer.android.com/develop/background-work/services/alarms
- https://developer.android.com/develop/background-work/services/fgs/service-types
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://github.com/batoulapps/adhan-java
