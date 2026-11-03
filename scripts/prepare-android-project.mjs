import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");
const javaDir = path.join(androidDir, "app", "src", "main", "java", "com", "momin", "noorulislam");

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

if (!fs.existsSync(androidDir)) {
  run("npx", ["cap", "add", "android"]);
}

const firebaseConfigSource = path.join(root, "google-services.json");
const firebaseConfigTarget = path.join(androidDir, "app", "google-services.json");
if (fs.existsSync(firebaseConfigSource)) {
  fs.mkdirSync(path.dirname(firebaseConfigTarget), { recursive: true });
  fs.copyFileSync(firebaseConfigSource, firebaseConfigTarget);
} else if (!fs.existsSync(firebaseConfigTarget)) {
  throw new Error(
    "Firebase configuration is missing. Place the downloaded google-services.json in the repository root, then run npm run android:prepare."
  );
}

const manifestPath = path.join(androidDir, "app", "src", "main", "AndroidManifest.xml");
if (!fs.existsSync(manifestPath)) {
  throw new Error("Capacitor did not generate AndroidManifest.xml.");
}

const nativeJavaFiles = [
  "MominPrayerAlarmPlugin.java",
  "MominAlarmScheduler.java",
  "MominPrayerAlarmReceiver.java",
  "MominAzanPlaybackService.java",
  "MominStopAzanReceiver.java",
  "MominAlarmBootReceiver.java"
];
fs.mkdirSync(javaDir, { recursive: true });
for (const name of nativeJavaFiles) {
  const source = path.join(root, "src", "native", "android", name);
  if (!fs.existsSync(source)) throw new Error("Missing native prayer alarm source: " + source);
  fs.copyFileSync(source, path.join(javaDir, name));
}

const mainActivityPath = path.join(javaDir, "MainActivity.java");
const mainActivity = `package com.momin.noorulislam;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MominPrayerAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle handle = getBridge().getPlugin("SocialLogin");
            if (handle == null) {
                Log.e("MOMIN Google Sign-In", "SocialLogin plugin handle is missing.");
                return;
            }
            Plugin plugin = handle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.e("MOMIN Google Sign-In", "Unexpected SocialLogin plugin instance.");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
`;
fs.writeFileSync(mainActivityPath, mainActivity, "utf8");

const drawableDir = path.join(androidDir, "app", "src", "main", "res", "drawable");
fs.mkdirSync(drawableDir, { recursive: true });
const notificationIcon = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M15.2,2.3 C9.5,2.3 5,6.8 5,12.4 C5,17.7 9.1,21.8 14.3,21.8 C17.6,21.8 20.4,20.2 22,17.5 C19.5,19.1 16.9,19.1 14.7,17.9 C11.1,16 10,11.7 12.1,8.3 C13.1,6.6 14.8,5.3 16.7,4.8 C16.4,3.8 15.9,3 15.2,2.3 Z" />
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M19.2,5.2 L20,7.1 L22,7.3 L20.5,8.7 L20.9,10.7 L19.2,9.7 L17.5,10.7 L17.9,8.7 L16.4,7.3 L18.4,7.1 Z" />
</vector>`;
fs.writeFileSync(path.join(drawableDir, "momin_notification_icon.xml"), notificationIcon, "utf8");

const rawDir = path.join(androidDir, "app", "src", "main", "res", "raw");
fs.mkdirSync(rawDir, { recursive: true });
const mp3Source = path.join(root, "makkah-azan-notification.mp3");
if (!fs.existsSync(mp3Source)) throw new Error("The uploaded Makkah Azan MP3 is missing.");
fs.copyFileSync(mp3Source, path.join(rawDir, "makkah_azan_notification.mp3"));

let manifest = fs.readFileSync(manifestPath, "utf8");
const permissions = [
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.WAKE_LOCK"
];
for (const permission of permissions) {
  if (!manifest.includes('android:name="' + permission + '"')) {
    manifest = manifest.replace(
      /(<manifest[^>]*>)/,
      '$1\n    <uses-permission android:name="' + permission + '" />'
    );
  }
}
if (!manifest.includes('android:usesCleartextTraffic=')) {
  manifest = manifest.replace("<application", '<application android:usesCleartextTraffic="false"');
}
const deepLink = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.momin.noorulislam" android:host="auth" android:path="/callback" />
            </intent-filter>`;
if (!manifest.includes('android:scheme="com.momin.noorulislam"')) {
  if (!manifest.includes("</activity>")) {
    throw new Error("Could not safely locate MainActivity in AndroidManifest.xml.");
  }
  manifest = manifest.replace("</activity>", deepLink + "\n        </activity>");
}

const fcmMetadata = `
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/momin_notification_icon" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="momin-announcements" />
`;
if (!manifest.includes("com.google.firebase.messaging.default_notification_icon")) {
  manifest = manifest.replace("</application>", fcmMetadata + "\n    </application>");
}

const nativeComponents = `
        <receiver android:name="com.momin.noorulislam.MominPrayerAlarmReceiver" android:enabled="true" android:exported="false" />
        <receiver android:name="com.momin.noorulislam.MominStopAzanReceiver" android:enabled="true" android:exported="false" />
        <receiver android:name="com.momin.noorulislam.MominAlarmBootReceiver" android:enabled="true" android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" />
            </intent-filter>
        </receiver>
        <service android:name="com.momin.noorulislam.MominAzanPlaybackService" android:enabled="true" android:exported="false" android:foregroundServiceType="mediaPlayback" />
`;
if (!manifest.includes("MominAzanPlaybackService")) {
  manifest = manifest.replace("</application>", nativeComponents + "\n    </application>");
}
fs.writeFileSync(manifestPath, manifest, "utf8");

const stringsPath = path.join(androidDir, "app", "src", "main", "res", "values", "strings.xml");
if (fs.existsSync(stringsPath)) {
  let strings = fs.readFileSync(stringsPath, "utf8");
  strings = strings.replace(/<string name="app_name">[^<]*<\/string>/, '<string name="app_name">MOMIN</string>');
  fs.writeFileSync(stringsPath, strings, "utf8");
}

const assetDir = path.join(root, "assets");
fs.mkdirSync(assetDir, { recursive: true });
const logoSource = path.join(root, "momin-mark.svg");
const logoTarget = path.join(assetDir, "logo.svg");
if (!fs.existsSync(logoSource)) {
  throw new Error("The existing MOMIN logo (momin-mark.svg) was not found.");
}
fs.copyFileSync(logoSource, logoTarget);

run("npx", [
  "@capacitor/assets",
  "generate",
  "--android",
  "--assetPath",
  "assets",
  "--iconBackgroundColor",
  "#0d0c0a",
  "--iconBackgroundColorDark",
  "#0d0c0a",
  "--splashBackgroundColor",
  "#0d0c0a",
  "--splashBackgroundColorDark",
  "#0d0c0a"
]);
run("npx", ["cap", "sync", "android"]);

console.log("MOMIN Android native project prepared. Package ID: com.momin.noorulislam");
