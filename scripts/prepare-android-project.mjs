import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

if (!fs.existsSync(androidDir)) {
  run("npx", ["cap", "add", "android"]);
}

const manifestPath = path.join(androidDir, "app", "src", "main", "AndroidManifest.xml");
if (!fs.existsSync(manifestPath)) {
  throw new Error("Capacitor did not generate AndroidManifest.xml.");
}

let manifest = fs.readFileSync(manifestPath, "utf8");
const permissions = [
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.POST_NOTIFICATIONS"
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
