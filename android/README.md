# MOMIN Android — Background Prayer Alarms + Makkah Azan

This Android Studio project wraps the existing live MOMIN website and adds native Android scheduling and audio playback. It reads location and prayer preferences from the WebView's storage and uses local calculations to schedule upcoming alarms for days ahead.

## Open and test
1. Install a current stable Android Studio release.
2. Open PowerShell and run the following commands from the project root after checking out this branch:

```powershell
Set-Location .\android
powershell -ExecutionPolicy Bypass -File .\setup-gradle-wrapper.ps1
```

The script downloads Gradle 8.13 and generates the Gradle wrapper. It does not publish or install MOMIN.
3. Open the android/ folder in Android Studio and allow Gradle sync to finish. Use JDK 17 if prompted.
4. Connect an Android phone with USB debugging enabled, or create an Android emulator, then press Run.
5. Inside MOMIN, open Settings → Location & Prayer Times, set and save the location and calculation method, then open Notifications & Adhan and save notification choices.
6. Allow Android notifications and the Alarms & reminders special access.
7. Keep MOMIN open for at least 15 seconds after saving settings so the native layer can sync and schedule alarms. Test by locking the screen and swiping the app away (do not force-stop it).

## Included
- Android app shell that opens https://noor-ul-islam-dua.onrender.com/.
- Reads saved coordinates, prayer calculation method, Asr method, prayer toggles, reminder lead time, and sound choice.
- Calculates a rolling eight days of prayer times locally.
- Schedules alarms through Android AlarmManager; exact scheduling is used if the user grants the special access, otherwise an inexact fallback is used.
- Reschedules after device reboot, time/time-zone changes, app replacement, and exact-alarm permission changes.
- Uses a native media-playback foreground service for the supplied MP3 and shows an ongoing notification with a Stop Azan action.

## Notes and limitations
- Chrome's localStorage is separate from this Android app's WebView storage. Save settings inside the Android app.
- Exact-alarm access gives the best chance of on-time delivery. Without it, Android may delay alarms and can restrict starting audio playback from the background.
- The supplied MP3 is the ringtone recording provided for this app (about 29 seconds); the native service plays that recording from local storage.
- Battery management, DND, manufacturer restrictions, notification permission denial, and force-stop may prevent or delay playback.
- Common Aladhan method IDs are mapped to supported Adhan Java calculations. Some provider-specific methods fall back to Muslim World League; verify the resulting times against the local mosque schedule.
- The project source has not yet been built with Android SDK/Gradle or device-tested in this environment. A successful Android Studio build and real-device test are required before publishing.
- Confirm rights to redistribute the supplied sound recording before publishing it publicly.
- Google Play requires new apps and app updates to target API 36 or higher as of 31 August 2026, subject to policy updates.

References:
- https://developer.android.com/develop/background-work/services/alarms
- https://developer.android.com/develop/background-work/services/fgs/service-types
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://github.com/batoulapps/adhan-java
