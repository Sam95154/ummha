import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "www");

const excludedNames = new Set([
  ".git",
  ".github",
  "node_modules",
  "android",
  "ios",
  "www",
  "scripts",
  "src",
  "assets",
  "package.json",
  "package-lock.json",
  "capacitor.config.ts",
  "ANDROID_SETUP.md",
  "google-services.json",
  ".gitignore"
]);

function copyAppFiles(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (excludedNames.has(entry.name)) continue;
    if (entry.name.endsWith(".aab") || entry.name.endsWith(".apk") || entry.name.endsWith(".jks")) continue;

    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyAppFiles(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

fs.rmSync(webDir, { recursive: true, force: true });
copyAppFiles(root, webDir);

const bridgeEntry = path.join(root, "src", "native", "momin-capacitor-bridge.js");
const bridgeOutput = path.join(webDir, "momin-capacitor-bridge.js");
execFileSync("npx", [
  "esbuild",
  bridgeEntry,
  "--bundle",
  "--platform=browser",
  "--format=iife",
  "--target=es2020",
  "--outfile=" + bridgeOutput
], { cwd: root, stdio: "inherit" });

// Native Google Credential Manager needs the OAuth Web client ID. Read the
// public client ID from the local Firebase config; never commit that config.
const googleServicesPath = path.join(root, "google-services.json");
if (!fs.existsSync(googleServicesPath)) {
  throw new Error("google-services.json is required to configure native Google sign-in.");
}
const googleConfig = JSON.parse(fs.readFileSync(googleServicesPath, "utf8"));
const androidClient = (googleConfig.client || []).find((entry) =>
  entry.client_info?.android_client_info?.package_name === "com.momin.noorulislam"
);
const googleOAuthClients = [
  ...(androidClient?.oauth_client || []),
  ...(androidClient?.services?.appinvite_service?.other_platform_oauth_client || [])
];
const googleWebClient = googleOAuthClients.find((entry) => Number(entry.client_type) === 3);
const configuredWebClientId = String(process.env.MOMIN_GOOGLE_WEB_CLIENT_ID || "").trim();
const candidateWebClientId = configuredWebClientId || googleWebClient?.client_id || "";
const validWebClientId = /^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(candidateWebClientId);
const isCiPreview = process.env.CI === "true" && !candidateWebClientId;
if (!validWebClientId && !isCiPreview) {
  throw new Error("Native Google sign-in needs a Web OAuth client ID. Set MOMIN_GOOGLE_WEB_CLIENT_ID or add a type 3 Web client to google-services.json.");
}
const webClientId = validWebClientId ? candidateWebClientId : "123456789012-preview.apps.googleusercontent.com";
if (!validWebClientId) {
  console.warn("MOMIN Android CI is using a build-only placeholder Google client ID. Native Google sign-in will not work until MOMIN_GOOGLE_WEB_CLIENT_ID is configured.");
}
const bridgeBundle = fs.readFileSync(bridgeOutput, "utf8");
fs.writeFileSync(
  bridgeOutput,
  "window.MOMIN_GOOGLE_WEB_CLIENT_ID = " + JSON.stringify(webClientId) + ";\n" + bridgeBundle,
  "utf8"
);

const indexPath = path.join(webDir, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
const firstAppScript = '<script src="./noor-v5.js';
if (!indexHtml.includes(firstAppScript)) {
  throw new Error("Could not find MOMIN startup script in the copied index.html.");
}
if (!indexHtml.includes("momin-capacitor-bridge.js")) {
  indexHtml = indexHtml.replace(
    firstAppScript,
    '<script src="./momin-capacitor-bridge.js?v=android-v4"></script>' + firstAppScript
  );
}
fs.writeFileSync(indexPath, indexHtml, "utf8");

const loginPath = path.join(webDir, "login.html");
let loginHtml = fs.readFileSync(loginPath, "utf8");
const supabaseScriptTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
if (!loginHtml.includes(supabaseScriptTag)) {
  throw new Error("Could not find Supabase SDK script in login.html.");
}
if (!loginHtml.includes("momin-capacitor-bridge.js")) {
  loginHtml = loginHtml.replace(
    supabaseScriptTag,
    '<script src="./momin-capacitor-bridge.js?v=android-v4"></script>\n' + supabaseScriptTag
  );
}
if (!loginHtml.includes("window.MominNative.signInWithGoogle")) {
  throw new Error("Native Google sign-in integration is missing from login.html.");
}
fs.writeFileSync(loginPath, loginHtml, "utf8");

if (!fs.existsSync(path.join(webDir, "index.html"))) {
  throw new Error("Android web bundle was not created.");
}
console.log("MOMIN Android web bundle prepared at " + webDir);
