import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const auth = read("momin-auth-v1.js");
const profile = read("momin-profile-settings-v1.js");
const adminApi = read("supabase/functions/momin-admin-api/index.ts");
const nativeBridge = read("src/native/momin-capacitor-bridge.js");
const androidPrep = read("scripts/prepare-android-project.mjs");
const androidWeb = read("scripts/prepare-android-web.mjs");
const login = read("login.html");
const reset = read("reset-password.html");
const deletion = read("supabase/functions/momin-delete-account/index.ts");

const checks = [];
function check(label, predicate) {
  assert.ok(predicate, label);
  checks.push(label);
}

// Returning-user persistence and profile fields.
check("Existing profile record is fetched before profile sync", /from\(["']momin_profiles["']\)[\s\S]*?select\(["']display_name,email,avatar_url,profile_image_path,birthday,gender,profile_completed/.test(auth));
check("Sign-in sync preserves existing birthday, gender, image path and profile state", /birthday:existing\.birthday[\s\S]*?gender:existing\.gender[\s\S]*?profile_image_path:existing\.profile_image_path/.test(auth));
check("Saved profile is loaded into Settings after sign-in", /profileApi\.setSession\(\{user:user,profile:savedProfile/.test(auth));
check("Settings renders name, email, birthday and gender fields", ["mprofile-name", "mprofile-email", "mprofile-birthday", "mprofile-gender"].every((x) => profile.includes(x)));
check("Profile save sends name, email, birthday, gender and avatar", /invoke\(["']saveProfile["'],\[formData\]\)/.test(profile) && /avatarFile:selectedAvatarFile/.test(profile));
check("Profile photo uses the authenticated user's storage folder", /user\.id\+["']\/profile-/.test(auth) && /storage\.from\(["']avatars["']\)\.upload/.test(auth));

// Admin profile visibility.
check("Admin API returns saved profile fields", ["avatar_url", "birthday", "gender", "auth_provider", "email_verified", "profile_completed"].every((x) => adminApi.includes(x)));

// Native Google sign-in and activity-result handling.
check("Android native sign-in uses Capacitor Social Login", /SocialLogin\.initialize/.test(nativeBridge) && /SocialLogin\.login\(\{ provider: "google"/.test(nativeBridge));
check("Google ID token is passed directly to Supabase Auth", /response\.result\.idToken/.test(nativeBridge) && /signInWithIdToken\(\{ provider: "google", token: idToken \}\)/.test(nativeBridge));
check("Android MainActivity forwards Google authorization results", /ModifiedMainActivityForSocialLoginPlugin/.test(androidPrep) && /handleGoogleLoginIntent\(requestCode, data\)/.test(androidPrep));

// Recovery path.
check("Forgot-password sends the Android recovery deep link", /com\.momin\.noorulislam:\/\/auth\/callback\?next=reset-password/.test(login));
check("Native callback returns the recovery session to the reset page", /next.*reset-password/.test(nativeBridge) && /reset-password\.html/.test(nativeBridge));
check("Reset page updates the password using the recovery session", /PASSWORD_RECOVERY/.test(reset) && /updateUser\(\{password:pass\}\)/.test(reset));

// Permanent deletion and accounting retention.
check("Deletion verifies the bearer token before acting", /auth\.getUser\(\)/.test(deletion));
check("Deletion removes profile, complaints, devices and push registrations", ["momin_profiles", "momin_complaints", "momin_devices", "momin_fcm_tokens", "momin_push_subscriptions"].every((x) => deletion.includes(x)));
check("Deletion anonymises financial history rather than deleting transactions", /momin_contributions["']\)\.update\(\{ user_id: null \}\)/.test(deletion));
check("Deletion permanently removes the authenticated Auth user", /auth\.admin\.deleteUser\(userId, false\)/.test(deletion));

// Android Web OAuth client configuration must never be silently invented for production.
check("Android build accepts a configured Web OAuth client ID", /MOMIN_GOOGLE_WEB_CLIENT_ID/.test(androidWeb));
check("CI placeholder explicitly warns that native Google login is unavailable", /build-only placeholder Google client ID/.test(androidWeb));

console.log("MOMIN user profile and authentication QA passed.");
console.log("Checks: " + checks.length);
for (const label of checks) console.log("PASS: " + label);
