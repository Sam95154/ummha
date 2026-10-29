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
