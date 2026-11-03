import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const privacy = read("privacy.html");
const deletionPage = read("delete-account.html");
const deletionJs = read("momin-public-account-deletion-v1.js");
const login = read("login.html");
const profile = read("momin-profile-settings-v1.js");

for (const phrase of [
  "Privacy Policy", "Effective date", "Account and profile information",
  "Device, session and notification information", "Location and prayer settings",
  "Supabase", "Firebase Cloud Messaging", "AlAdhan", "Quran.com API",
  "Retention and account deletion", "Limited financial-record exception",
  "mominsupport0@gmail.com"
]) assert.ok(privacy.toLowerCase().includes(phrase.toLowerCase()), "Privacy policy is missing: " + phrase);

for (const phrase of [
  "delete-account.html", "Send verification link",
  "Permanently delete my account", "confirm-checkbox", "Privacy Policy"
]) assert.ok(deletionPage.includes(phrase), "Deletion page is missing: " + phrase);

assert.match(deletionJs, /signInWithOtp/);
assert.match(deletionJs, /shouldCreateUser:\s*false/);
assert.match(deletionJs, /emailRedirectTo:\s*window\.location\.origin\s*\+\s*"\/delete-account\.html"/);
assert.match(deletionJs, /functions\.invoke\("momin-delete-account"/);
assert.match(deletionJs, /response\.data\.success\s*!==\s*true/);
assert.match(deletionJs, /confirm-checkbox/);
assert.doesNotMatch(deletionJs, /SUPABASE_SERVICE_ROLE_KEY|service_role|secret_key/i);
assert.doesNotMatch(deletionPage, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
new Script(deletionJs, { filename: "momin-public-account-deletion-v1.js" });

assert.match(login, /href=["']\/privacy\.html["']/);
assert.match(login, /href=["']\/delete-account\.html["']/);
assert.match(profile, /href=["']\/privacy\.html["']/);
assert.match(profile, /href=["']\/delete-account\.html["']/);
console.log("MOMIN privacy and external account-deletion static QA passed.");
