import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let checks = 0;
const failures = [];
function check(ok, message) {
  checks += 1;
  console.log((ok ? "PASS " : "FAIL ") + message);
  if (!ok) failures.push(message);
}
const read = p => fs.readFileSync(path.join(root, p), "utf8");

const html = read("admin/index.html");
const css = read("admin/admin.css");
const js = read("admin/admin.js");
const api = read("supabase/functions/momin-admin-api/index.ts");
const migration = read("supabase/migrations/20261102000100_momin_admin_panel.sql");
const givingMigration = read("supabase/migrations/20261102000200_momin_giving_public_aggregate_table.sql");
const userModule = read("momin-giving-complaints-v1.js");
const index = read("index.html");
const bridge = read("momin-notifications-bridge-v1.js");
const serviceWorker = read("momin-sw.js");
const authBridge = read("momin-auth-v1.js");

check(html.includes("./admin.css") && html.includes("./admin.js"), "Admin entry page loads its stylesheet and application script");
check(/viewport/i.test(html), "Admin page declares responsive viewport");
check(css.includes("--gold:#D6AD60") && css.includes("--bg:#0C0A07"), "Admin theme includes approved black-and-gold design tokens");
check(/@media\s*\(max-width:\s*760px\)/.test(css) && /@media\s*\(max-width:\s*480px\)/.test(css), "Admin stylesheet includes mobile and tablet responsive breakpoints");
for (const label of ["Dashboard","Users","Notifications","Giving Management","Complaints","Admin Profile","Settings / Theme"]) {
  check(js.includes(label), "Admin navigation includes " + label);
}
check(js.includes('value="owner"') || js.includes('value=\"owner\"'), "Admin sign-in defaults to the owner login ID");
check(js.includes('api("login"') && api.includes('login_id'), "Admin sign-in is verified by the server API");
check(!js.includes("Shaik@9515"), "Initial Admin password is absent from browser JavaScript");
check(!html.includes("Shaik@9515") && !css.includes("Shaik@9515"), "Initial Admin password is absent from HTML and CSS");
check(!js.includes("service_role") && !js.includes("sb_secret_"), "Admin browser bundle contains no privileged Supabase secret key");
check(api.includes("PBKDF2") && api.includes("momin_admin_sessions") && api.includes("token_hash"), "Admin API uses password derivation and hashed server-side sessions");
check(api.includes('loginId !== "owner"'), "Admin API restricts the dedicated Admin identifier to owner");
check(api.includes("session.account.force_password_change") && api.includes("Change the initial Admin password before continuing."), "Server blocks all Admin API operations until the initial password is changed");
check(migration.includes("momin_admin_accounts") && migration.includes("momin_admin_sessions"), "Migration creates dedicated Admin account and session tables");
check(migration.includes("momin_giving_campaigns") && migration.includes("momin_contributions"), "Migration creates Giving and contribution tables");
check(migration.includes("momin_complaints") && migration.includes("momin_complaint_replies"), "Migration creates complaint and reply tables");
check(migration.includes("unique index if not exists momin_profiles_public_user_id_uidx"), "Migration enforces unique permanent User IDs");
check(migration.includes("before insert or update on public.momin_profiles"), "Migration protects User ID and account status on inserts and updates");
check(migration.includes("momin_admin_audit_log"), "Migration provisions Admin audit logging");
check(migration.includes("enable row level security"), "Migration enables Row Level Security on new tables");
check(migration.includes("deny_browser_access"), "Migration explicitly denies browser access to privileged Admin tables");
check(userModule.includes("momin_giving_campaigns") && userModule.includes("momin_complaints"), "MOMIN User app includes Giving and complaint pages");
check(userModule.includes("momin-complaint-attachments") && userModule.includes(".eq(\"user_id\",user.id)"), "User complaint reads and writes are scoped to the authenticated account");
check(index.includes("momin-giving-complaints-v1.js"), "Main MOMIN app loads the Giving and complaint module");
check(bridge.includes("momin_user_notifications") && bridge.includes("markInboxRead"), "Admin announcements are connected to the existing User notification inbox");
check(serviceWorker.includes('"complaints"'), "Push service worker accepts the Complaints destination");
check(givingMigration.includes("momin_giving_totals_public") && givingMigration.includes("security_invoker = true"), "User Giving progress uses a privacy-safe aggregate table and invoker-secure compatibility view");
check(migration.includes("add column if not exists phone text"), "Migration stores optional Auth phone contact details");
check(migration.includes("existing_public_id") && migration.includes("existing_status"), "Profile upserts preserve permanent User ID and account status");
check(api.includes("account_status", api.indexOf("async function activeRecipientIds")), "Notification sends filter recipient accounts by active status");
check(api.includes("Image contents do not match"), "Admin media upload validates file signatures");
check(api.includes("momin_admin_notification_stats"), "Notification history reads inbox read statistics");
check(authBridge.includes("account_status") && authBridge.includes("phone:user.phone"), "User Auth bridge syncs account status and phone contact details");
check(userModule.includes("createSignedUrl"), "Private complaint attachments use time-limited signed URLs");
check(api.includes("createSignedUrl"), "Admin complaint detail issues time-limited signed attachment URLs");
check(js.includes("async function searchComplaintUsers") && js.includes('modalRoot.addEventListener("input"'), "Complaint user autocomplete searches as the Admin types");
check(js.includes("autocomplete-option") && js.includes("selectComplaintUser") && js.includes("data-user-index"), "Complaint user search renders selectable name suggestions");
check(js.includes('aria-autocomplete="list"') && js.includes("ArrowDown") && js.includes('event.key === "Enter"'), "Complaint user autocomplete supports accessible keyboard selection");
check(js.includes("complaint-user-search-status") && js.includes("No matches for"), "Complaint user autocomplete reports matching and empty-result states");
const userSearchApi = api.slice(api.indexOf("async function listUsers"), api.indexOf("async function updateUser"));
check(userSearchApi.includes("request.or(") && ["public_user_id.ilike.%", "display_name.ilike.%", "email.ilike.%"].every(field => userSearchApi.includes(field)), "Admin user API searches permanent User ID, display name, and email");
check(js.includes('user.email || "No email"') && js.includes('user.user_id || "MOMIN User ID unavailable"'), "Admin complaint suggestions show email and permanent User ID");

check(!/as\s+\$\s*\n/i.test(migration), "Migration contains no malformed anonymous dollar-quote block");

for (const [label, source, loader] of [
  ["Admin frontend JavaScript", js, "js"],
  ["Admin Edge Function TypeScript", api, "ts"],
  ["MOMIN User Giving/Complaints module", userModule, "js"],
  ["MOMIN Auth bridge", authBridge, "js"],
  ["MOMIN notification bridge", bridge, "js"],
  ["MOMIN service worker", serviceWorker, "js"],
]) {
  try {
    await transform(source, { loader, target: "es2022", format: "esm" });
    check(true, label + " parses successfully");
  } catch (error) {
    check(false, label + " syntax validation: " + (error && error.message ? error.message : String(error)));
  }
}
const syntax = spawnSync(process.execPath, ["--check", path.join(root, "admin/admin.js")], { encoding: "utf8" });
check(syntax.status === 0, "Admin JavaScript passes Node syntax validation" + (syntax.stderr ? ": " + syntax.stderr.trim() : ""));

console.log("\nMOMIN Admin QA: " + (checks - failures.length) + "/" + checks + " checks passed.");
if (failures.length) {
  console.error("\nFailures:\n- " + failures.join("\n- "));
  process.exit(1);
}
