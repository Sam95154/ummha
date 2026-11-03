import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const onboarding = read("profile-complete.html");
const auth = read("momin-auth-v1.js");
const profile = read("momin-profile-settings-v1.js");
const settings = read("momin-settings-design-v2.js");
const adminApi = read("supabase/functions/momin-admin-api/index.ts");
const index = read("index.html");

const checks = [];
function check(label, predicate) {
  assert.ok(predicate, label);
  checks.push(label);
}

// First-time onboarding writes the verified account's profile and checks the row returned by Postgres.
check("Onboarding stores the verified Auth email with the profile", /email:user\.email\|\|null/.test(onboarding));
check("Onboarding persists the user name, birthday and gender", /display_name:name,email:user\.email\|\|null[\s\S]*?birthday:dob,gender:gender/.test(onboarding));
check("Onboarding preserves the permanent user ID and account preferences", /public_user_id:\(profile&&profile\.public_user_id\)\|\|undefined/.test(onboarding) && /announcements_enabled:profile\?!!profile\.announcements_enabled:false/.test(onboarding) && /phone:\(profile&&profile\.phone\)\|\|null/.test(onboarding));
check("Onboarding confirms the database save before redirecting", /upsert\(data,\{onConflict:"user_id"\}\)[\s\S]*?\.select\([\s\S]*?\.single\(\)[\s\S]*?saved\.birthday[\s\S]*?saved\.gender/.test(onboarding));
check("Password changes use Supabase Auth rather than the profile row", /auth\.updateUser\(\{password:p\}\)/.test(onboarding));

// Every sign-in fetches and preserves saved profile fields instead of replacing them from provider metadata.
check("Session sync loads existing MOMIN profile fields before upsert", /from\("momin_profiles"\)[\s\S]*?select\("display_name,email,avatar_url,profile_image_path,birthday,gender,profile_completed/.test(auth));
check("Session sync preserves birthday, gender and completion state", /birthday:existing\.birthday[\s\S]*?gender:existing\.gender[\s\S]*?profile_completed:!!existing\.profile_completed/.test(auth));
check("Session sync returns and injects the saved profile into Settings", /\.select\("user_id,display_name,email[\s\S]*?birthday,gender,profile_completed[\s\S]*?return saved\.data/.test(auth) && /profileApi\.setSession\(\{user:user,profile:savedProfile/.test(auth));
check("The profile model consumes saved database values", /var saved=input\.profile\|\|user\.profile\|\|\{\}/.test(profile) && /birthday:String\(saved\.birthday\|\|""\)/.test(profile) && /gender:String\(saved\.gender\|\|""\)/.test(profile));

// The user-facing Settings profile explicitly renders the saved values.
check("Settings renders a readable birthday", /function profileBirthday\(value\)/.test(settings) && /profileBirthday\(u\.birthday\)/.test(settings));
check("Settings renders the saved gender", /function profileGender\(value\)/.test(settings) && /profileGender\(u\.gender\)/.test(settings));

// The privileged admin API returns onboarding details. Admin passwords are never part of user-profile responses.
check("Admin user list can return birthday and gender", /select\("user_id,public_user_id,display_name,email,phone,account_status,created_at,avatar_url,birthday,gender,auth_provider,email_verified,profile_completed", \{ count: "exact" \}\)/.test(adminApi) && /birthday: p\.birthday \|\| null/.test(adminApi) && /gender: p\.gender \|\| null/.test(adminApi));
check("Admin user detail returns birthday, gender and completion timestamp", /profile_image_path,birthday,gender,auth_provider,email_verified,account_status,created_at,updated_at,profile_completed,profile_completed_at/.test(adminApi) && /birthday: profile\?\.birthday \|\| null, gender: profile\?\.gender \|\| null/.test(adminApi));
check("The signed-in app refreshes profile assets instead of using stale cache URLs", ["momin-profile-settings-v1.js?v=20261103-profile-details-v1","momin-auth-v1.js?v=20261103-profile-details-v1","momin-settings-design-v2.js?v=20261103-profile-details-v1"].every((value) => index.includes(value)));

console.log("MOMIN profile details persistence QA passed.");
console.log("Checks: " + checks.length);
for (const label of checks) console.log("PASS: " + label);
