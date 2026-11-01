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

const indexPath = path.join(webDir, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
const authScript = '<script src="./momin-auth-v1.js';
if (!indexHtml.includes(authScript)) {
  throw new Error("Could not find MOMIN auth script in the copied index.html.");
}
if (!indexHtml.includes("momin-capacitor-bridge.js")) {
  indexHtml = indexHtml.replace(
    authScript,
    '<script src="./momin-capacitor-bridge.js?v=android-v1"></script>' + authScript
  );
}
fs.writeFileSync(indexPath, indexHtml, "utf8");

const authPath = path.join(webDir, "momin-auth-v1.js");
let authJs = fs.readFileSync(authPath, "utf8");
const oldOAuth = `options:{redirectTo:location.origin+"/"}
        });
        if(error)throw error;return data;`;
const nativeOAuth = `options:{redirectTo:(window.MominNative&&window.MominNative.isNative)?window.MominNative.authRedirectUrl:location.origin+"/",skipBrowserRedirect:!!(window.MominNative&&window.MominNative.isNative)}
        });
        if(error)throw error;
        if(window.MominNative&&window.MominNative.isNative&&data&&data.url)await window.MominNative.openOAuth(data.url);
        return data;`;
if (!authJs.includes(oldOAuth)) {
  throw new Error("Could not safely locate the Google sign-in block in momin-auth-v1.js; refusing to patch it.");
}
authJs = authJs.replace(oldOAuth, nativeOAuth);
fs.writeFileSync(authPath, authJs, "utf8");

if (!fs.existsSync(path.join(webDir, "index.html"))) {
  throw new Error("Android web bundle was not created.");
}
console.log("MOMIN Android web bundle prepared at " + webDir);
