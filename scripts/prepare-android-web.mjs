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


function configureNativePkceAuth(source, fileName) {
  // The native callback handler exchanges an authorization code, so the
  // Capacitor WebView must initiate OAuth with PKCE. Keep the website's
  // existing implicit flow unchanged.
  const existing = 'auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}';
  const native = 'auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:(window.MominNative&&window.MominNative.isNative)?"pkce":"implicit"}';
  if (source.includes(native)) return source;

  const occurrences = source.split(existing).length - 1;
  if (occurrences !== 1) {
    throw new Error("Could not safely configure native PKCE in " + fileName + "; expected exactly one Supabase auth config, found " + occurrences + ".");
  }

  const updated = source.replace(existing, native);
  if (!updated.includes(native)) {
    throw new Error("Native PKCE configuration was not applied to " + fileName + ".");
  }
  return updated;
}

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
const firstAppScript = '<script src="./noor-v5.js';
if (!indexHtml.includes(firstAppScript)) {
  throw new Error("Could not find MOMIN startup script in the copied index.html.");
}
if (!indexHtml.includes("momin-capacitor-bridge.js")) {
  indexHtml = indexHtml.replace(
    firstAppScript,
    '<script src="./momin-capacitor-bridge.js?v=android-v3"></script>' + firstAppScript
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
    '<script src="./momin-capacitor-bridge.js?v=android-v3"></script>\\n' + supabaseScriptTag
  );
}

const oldLoginOAuth = `redirectTo:location.origin+"/",
        queryParams:{access_type:"offline",prompt:"select_account"}
      }
    });
    if(result.error)throw result.error;
    if(!result.data||!result.data.url)throw new Error("Google sign-in could not be started.");`;
const nativeLoginOAuth = `redirectTo:(window.MominNative&&window.MominNative.isNative)?window.MominNative.authRedirectUrl:location.origin+"/",
        skipBrowserRedirect:!!(window.MominNative&&window.MominNative.isNative),
        queryParams:{access_type:"offline",prompt:"select_account"}
      }
    });
    if(result.error)throw result.error;
    if(!result.data||!result.data.url)throw new Error("Google sign-in could not be started.");
    if(window.MominNative&&window.MominNative.isNative)await window.MominNative.openOAuth(result.data.url);`;
if (!loginHtml.includes(oldLoginOAuth)) {
  throw new Error("Could not safely locate the Google sign-in block in login.html; refusing to patch it.");
}
loginHtml = loginHtml.replace(oldLoginOAuth, nativeLoginOAuth);
loginHtml = configureNativePkceAuth(loginHtml, "login.html");
// Password recovery uses a one-time code entered in the app. Do not
// rewrite the recovery email to a browser or custom-scheme callback.
fs.writeFileSync(loginPath, loginHtml, "utf8");

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
authJs = configureNativePkceAuth(authJs, "momin-auth-v1.js");
fs.writeFileSync(authPath, authJs, "utf8");

if (!fs.existsSync(path.join(webDir, "index.html"))) {
  throw new Error("Android web bundle was not created.");
}
console.log("MOMIN Android web bundle prepared at " + webDir);
