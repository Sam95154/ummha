package com.sam95154.momin;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.GeolocationPermissions.Callback;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.view.Menu;
import android.view.MenuItem;

public class MainActivity extends Activity {
    private static final String START_URL = "https://noor-ul-islam-dua.onrender.com/";
    private static final String TRUSTED_HOST = "noor-ul-islam-dua.onrender.com";
    private static final int REQUEST_NOTIFICATIONS = 7001, REQUEST_LOCATION = 7002;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView webView;
    private Callback pendingGeoCallback;
    private String pendingGeoOrigin;
    private final Runnable syncRunnable = new Runnable() {
        @Override public void run() { syncSettingsFromWebsite(); if (webView != null) handler.postDelayed(this, 15000L); }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        NotificationHelper.ensureChannels(this);
        buildWebView();
        boolean asked = false;
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATIONS);
            asked = true;
        }
        if (!asked) explainExactAlarmPermissionIfNeeded();
        webView.loadUrl(START_URL);
    }

    private void buildWebView() {
        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        webView.addJavascriptInterface(new NativePrayerBridge(this), "MominNativePrayerBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && TRUSTED_HOST.equalsIgnoreCase(uri.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) { super.onPageFinished(view, url); syncSettingsFromWebsite(); }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onGeolocationPermissionsShowPrompt(String origin, Callback callback) {
                if (!TRUSTED_HOST.equalsIgnoreCase(Uri.parse(origin).getHost())) { callback.invoke(origin, false, false); return; }
                if (hasLocationPermission()) callback.invoke(origin, true, false);
                else {
                    pendingGeoOrigin = origin; pendingGeoCallback = callback;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQUEST_LOCATION);
                }
            }
        });
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
    }

    private boolean hasLocationPermission() {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void explainExactAlarmPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am == null || am.canScheduleExactAlarms()) return;
        SharedPreferences ui = getSharedPreferences("momin_ui", MODE_PRIVATE);
        if (ui.getBoolean("exact_alarm_prompted", false)) return;
        ui.edit().putBoolean("exact_alarm_prompted", true).apply();
        new AlertDialog.Builder(this).setTitle("Enable reliable prayer alarms")
                .setMessage("Allow MOMIN to set alarms and reminders so it can schedule prayer-time alerts while the app is closed or the screen is locked. Without this access, Android may delay alerts and full Azan playback may not start in the background.")
                .setPositiveButton("Open alarm settings", (d, w) -> {
                    try { startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) { }
                }).setNegativeButton("Not now", null).show();
    }

    @Override public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, 9101, 0, "Prayer alarm status");
        menu.add(0, 9102, 1, "Test Makkah Azan");
        menu.add(0, 9103, 2, "Open Alarms & reminders");
        menu.add(0, 9104, 3, "Notification settings");
        return true;
    }

    @Override public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case 9101: showNativePrayerStatus(); return true;
            case 9102: testNativeAzan(); return true;
            case 9103: openExactAlarmSettings(); return true;
            case 9104: openNotificationSettings(); return true;
            default: return super.onOptionsItemSelected(item);
        }
    }

    private void showNativePrayerStatus() {
        SharedPreferences p = getSharedPreferences(PrayerScheduler.PREFS, MODE_PRIVATE);
        boolean notifications = Build.VERSION.SDK_INT < 33 ||
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || (am != null && am.canScheduleExactAlarms());
        boolean locationSaved = p.contains(PrayerScheduler.KEY_LAT) && p.contains(PrayerScheduler.KEY_LON);
        String sound = p.getString(PrayerScheduler.KEY_SOUND, "azan");
        String message =
                "Prayer reminders: " + (p.getBoolean(PrayerScheduler.KEY_ENABLED, false) ? "enabled" : "disabled") + "\n" +
                "Location saved for native alarms: " + (locationSaved ? "yes" : "no") + "\n" +
                "Notifications permission: " + (notifications ? "allowed" : "not allowed") + "\n" +
                "Exact alarm access: " + (exact ? "allowed" : "not allowed — alarms may be delayed") + "\n" +
                "Sound mode: " + sound + "\n\n" +
                "For background Azan, save location and notification settings inside MOMIN, allow notifications, and enable Alarms & reminders. Battery controls, Do Not Disturb and force-stop can still affect playback.";
        new AlertDialog.Builder(this)
                .setTitle("MOMIN · Android prayer alarms")
                .setMessage(message)
                .setPositiveButton("Open alarm settings", (dialog, which) -> openExactAlarmSettings())
                .setNeutralButton("Test Azan", (dialog, which) -> testNativeAzan())
                .setNegativeButton("Close", null)
                .show();
    }

    private void openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            Toast.makeText(this, "This Android version does not need special exact-alarm access.", Toast.LENGTH_LONG).show();
            return;
        }
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())));
        } catch (Exception ex) {
            Toast.makeText(this, "Open Android Settings → Apps → MOMIN → Alarms & reminders.", Toast.LENGTH_LONG).show();
        }
    }

    private void openNotificationSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
            startActivity(intent);
        } catch (Exception ex) {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); }
            catch (Exception ignored) { Toast.makeText(this, "Open Android Settings → Apps → MOMIN → Notifications.", Toast.LENGTH_LONG).show(); }
        }
    }

    private void testNativeAzan() {
        try {
            Intent intent = new Intent(this, AdhanPlaybackService.class)
                    .setAction(AdhanPlaybackService.ACTION_PLAY)
                    .putExtra(PrayerAlarmReceiver.EXTRA_PRAYER, "Test");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent);
            else startService(intent);
            Toast.makeText(this, "Native Makkah Azan test started. Use the persistent notification's Stop Azan action to stop it.", Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            Toast.makeText(this, "Could not start Azan playback. Check notification and audio permissions.", Toast.LENGTH_LONG).show();
        }
    }

    private void syncSettingsFromWebsite() {
        if (webView == null) return;
        String js = "(function(){try{" +
                "var get=function(k,d){var v=localStorage.getItem(k);return v===null?d:v};" +
                "var cache=null;try{cache=JSON.parse(get('noor-prayer-cache','null'))}catch(e){};" +
                "var data=window.livePrayer||(cache&&cache.data)||null;var meta=(data&&data.meta)||{};var store=window.API_STORE||{};" +
                "var num=function(){for(var i=0;i<arguments.length;i++){var n=Number(arguments[i]);if(arguments[i]!==null&&arguments[i]!==undefined&&arguments[i]!==''&&isFinite(n))return n;}return null};" +
                "var lat=num(get('noor-latitude',null),store.latitude,cache&&cache.latitude,meta.latitude);" +
                "var lon=num(get('noor-longitude',null),store.longitude,cache&&cache.longitude,meta.longitude);var master=get('noor-notifications','true')!=='false';" +
                "var method=String((store&&store.method)||get('noor-method',null)||(cache&&cache.method)||'3');" +
                "var p={latitude:lat,longitude:lon,timezone:String(meta.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'),method:method,madhab:get('noor-asr-method','standard'),notifications:master," +
                "fajr:get('noor-notify-fajr',master?'true':'false')!=='false',dhuhr:get('noor-notify-dhuhr',master?'true':'false')!=='false',asr:get('noor-notify-asr',master?'true':'false')!=='false'," +
                "maghrib:get('noor-notify-maghrib',master?'true':'false')!=='false',isha:get('noor-notify-isha',master?'true':'false')!=='false'," +
                "reminderMinutes:Number(get('noor-prayer-reminder-minutes','0'))||0,sound:get('noor-adhan-sound','azan'),city:get('noor-city',store.city||''),country:get('noor-country',store.country||'')};" +
                "if(window.MominNativePrayerBridge)window.MominNativePrayerBridge.syncSettings(JSON.stringify(p));}catch(e){}})();";
        webView.evaluateJavascript(js, null);
    }

    @Override protected void onResume() { super.onResume(); PrayerScheduler.scheduleUpcoming(getApplicationContext()); handler.removeCallbacks(syncRunnable); handler.post(syncRunnable); }
    @Override protected void onPause() { handler.removeCallbacks(syncRunnable); super.onPause(); }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQUEST_LOCATION && pendingGeoCallback != null) {
            pendingGeoCallback.invoke(pendingGeoOrigin, hasLocationPermission(), false); pendingGeoCallback = null; pendingGeoOrigin = null;
        }
        if (requestCode == REQUEST_NOTIFICATIONS) {
            Toast.makeText(this, results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED ? "MOMIN notifications enabled" : "Notifications are disabled; prayer alerts may not appear", Toast.LENGTH_LONG).show();
            handler.postDelayed(this::explainExactAlarmPermissionIfNeeded, 700L);
        }
    }

    @Override protected void onDestroy() {
        handler.removeCallbacks(syncRunnable);
        if (webView != null) { webView.removeJavascriptInterface("MominNativePrayerBridge"); webView.stopLoading(); webView.setWebChromeClient(null); webView.setWebViewClient(null); webView.destroy(); webView = null; }
        super.onDestroy();
    }

    public static final class NativePrayerBridge {
        private final MainActivity activity;
        NativePrayerBridge(MainActivity activity) { this.activity = activity; }
        @JavascriptInterface public void syncSettings(String json) { activity.runOnUiThread(() -> PrayerScheduler.updateFromWebsite(activity.getApplicationContext(), json)); }
    }
}
