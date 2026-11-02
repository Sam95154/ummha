import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const capacitor = JSON.parse(read("capacitor.config.json"));
const androidPrep = read("scripts/prepare-android-project.mjs");
const webPrep = read("scripts/prepare-android-web.mjs");
const nativeBridge = read("src/native/momin-capacitor-bridge.js");
const notificationBridge = read("momin-notifications-admin-inbox-v1.js");
const authBridge = read("momin-auth-v1.js");
const registerFunction = read("supabase/functions/momin-fcm-register/index.ts");
const adminFunction = read("supabase/functions/momin-admin-api/index.ts");
const migration = read("supabase/migrations/20261102000500_momin_native_fcm.sql");
const ignore = read(".gitignore");
const setup = read("ANDROID_SETUP.md");

function contains(source, text, label) {
  assert.ok(source.includes(text), label + " is missing: " + text);
}

function excludes(source, text, label) {
  assert.ok(!source.includes(text), label + " must not contain: " + text);
}

assert.equal(pkg.dependencies["@capacitor/push-notifications"], "8.1.3",
  "Capacitor 8 push plugin must be pinned to the tested compatible release.");
assert.equal(capacitor.appId, "com.momin.noorulislam", "Android package ID changed unexpectedly.");
contains(androidPrep, 'path.join(root, "google-services.json")', "Firebase config source");
contains(androidPrep, 'path.join(androidDir, "app", "google-services.json")', "Firebase app config destination");
contains(androidPrep, "momin_notification_icon.xml", "Branded notification icon generation");
contains(androidPrep, "com.google.firebase.messaging.default_notification_channel_id", "FCM channel metadata");
contains(webPrep, '"google-services.json"', "Firebase config exclusion from web bundle");
contains(ignore, "google-services.json", "Firebase config Git ignore rule");
contains(ignore, "*.jks", "Android signing key Git ignore rule");
contains(ignore, "*.keystore", "Android keystore Git ignore rule");

contains(nativeBridge, 'import { PushNotifications } from "@capacitor/push-notifications";', "Native FCM plugin import");
contains(nativeBridge, 'addListener("registration"', "FCM token registration listener");
contains(nativeBridge, 'addListener("registrationError"', "FCM registration error listener");
contains(nativeBridge, 'addListener("pushNotificationReceived"', "Foreground push listener");
contains(nativeBridge, 'addListener("pushNotificationActionPerformed"', "Notification tap listener");
contains(nativeBridge, 'functions.invoke("momin-fcm-register"', "Authenticated token registration call");
contains(nativeBridge, "notification_id", "Notification identity routing");
contains(notificationBridge, "window.MominNativePush.register()", "Native FCM registration from settings");
contains(notificationBridge, "window.MominNativePush.disable()", "Native FCM disable on opt-out");
contains(authBridge, "syncIfEnabled()", "FCM token refresh after auth/device sync");

contains(registerFunction, 'auth.getUser()', "Server-side user authentication");
contains(registerFunction, 'from("momin_devices")', "Registered device ownership check");
contains(registerFunction, 'from("momin_fcm_tokens")', "Private token write");
contains(registerFunction, 'onConflict: "fcm_token"', "Token refresh/upsert behavior");
excludes(registerFunction, "SUPABASE_SERVICE_ROLE_KEY\");\\nconst SUPABASE_SERVICE_ROLE_KEY = \"", ""); // no-op guard for source formatting

contains(migration, "enable row level security", "FCM table RLS");
contains(migration, "revoke all on public.momin_fcm_tokens from anon, authenticated", "Token table client access revocation");
contains(migration, "grant all on public.momin_fcm_tokens to service_role", "Trusted Edge Function token access");
contains(migration, "momin_fcm_deliveries", "FCM delivery audit table");
contains(adminFunction, "FCM_SERVICE_ACCOUNT_JSON", "Server-only Firebase credential");
contains(adminFunction, "https://fcm.googleapis.com/v1/projects/", "FCM HTTP v1 endpoint");
contains(adminFunction, "announcements_enabled", "User announcement preference filter");
contains(adminFunction, "UNREGISTERED", "Stale FCM token handling");
contains(adminFunction, "2419200", "Four-week offline delivery TTL");
contains(adminFunction, "momin_fcm_deliveries", "FCM delivery audit writes");
excludes(nativeBridge, "FCM_SERVICE_ACCOUNT_JSON", "Native client Firebase credentials");
excludes(nativeBridge, "private_key", "Native client private-key material");
excludes(notificationBridge, "FCM_SERVICE_ACCOUNT_JSON", "Web notification bridge Firebase credentials");

contains(setup, "momin-fcm-register", "Deployment documentation");
contains(setup, "FCM_SERVICE_ACCOUNT_JSON", "Firebase server secret documentation");
contains(setup, "google-services.json", "Local Firebase config instructions");

console.log("MOMIN native FCM static QA passed.");
console.log("Checks: Capacitor dependency, Android config handling, secret exclusions, native registration/events, auth/device ownership, RLS, Admin FCM delivery, offline TTL, and setup documentation.");
