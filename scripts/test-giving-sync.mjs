import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const giving = read("momin-giving-complaints-v1.js");
const adminApi = read("supabase/functions/momin-admin-api/index.ts");
const migration = read("supabase/migrations/20261102152955_momin_giving_user_read_access.sql");

new vm.Script(giving, { filename: "momin-giving-complaints-v1.js" });
console.log("PASS: User Giving module parses.");

const authScript = html.indexOf("momin-auth-v1.js");
const givingScript = html.indexOf("momin-giving-complaints-v1.js?v=20261102-admin-user-giving-sync-v1");
assert.ok(authScript >= 0, "The main User app must load the MOMIN auth bridge.");
assert.ok(givingScript > authScript, "The Giving module must load after the authenticated Supabase client.");
console.log("PASS: User app loads Giving integration after authentication.");

for (const category of ["All", "Zakat", "Sadaqah", "Charity", "Other approved"]) {
  assert.ok(giving.includes('"'+category+'"'), "Missing Giving category filter: " + category);
}
assert.ok(giving.includes("data-giving-filter"), "Category filter buttons must be wired.");
assert.ok(giving.includes('state.campaignFilter === "All" || c.category === state.campaignFilter'),
  "Selecting a category must filter campaign cards.");
assert.ok(giving.includes("data-giving-action='retry'"), "Campaign loading errors need a retry path.");
console.log("PASS: Giving category filters and retry action are present.");

assert.ok(giving.includes("await getUser()"), "Only a signed-in MOMIN user should load the campaign list.");
assert.ok(giving.includes('.from("momin_giving_campaigns")'), "User page must query the Admin campaign table.");
assert.ok(giving.includes('.eq("status", "Active")'), "User page must show Active campaigns only.");
assert.ok(giving.includes("c.starts_at <= today") && giving.includes("c.ends_at >= today"),
  "Campaign date windows must be respected.");
for (const field of ["name", "category", "description", "target_amount", "currency", "donation_instructions"]) {
  assert.ok(giving.includes(field), "Campaign UI must support " + field + ".");
}
assert.ok(giving.includes("data-campaign-id"), "Each rendered card must retain its campaign identity.");
console.log("PASS: User Giving list is backed by active, in-date Admin campaigns.");

assert.ok(giving.includes('.from("momin_giving_totals_public")'),
  "User Giving must read the aggregate-only contribution totals.");
assert.ok(giving.includes("[c.id, c.category, c.currency].join("|")"),
  "Totals must be matched to the same campaign, fund category, and currency.");
assert.ok(!/\.from\(["']momin_giving_campaigns["']\)\s*\.(?:insert|update|upsert|delete)/i.test(giving),
  "The browser must not mutate Admin campaign records.");
assert.ok(!/payment\s+(?:successful|completed)|donation\s+(?:successful|completed)/i.test(giving),
  "The user interface must not fake a successful payment.");
assert.ok(giving.includes("Online checkout is not available yet"),
  "The page must clearly disclose that online checkout is not connected.");
console.log("PASS: Aggregate totals are read-only and no false payment flow is exposed.");

assert.ok(adminApi.includes("SUPABASE_SERVICE_ROLE_KEY"), "Admin API must use its server-side service role.");
assert.ok(adminApi.includes('case "campaigns"') && adminApi.includes('case "save_campaign"') &&
  adminApi.includes('case "campaign_status"'), "Admin campaign list/create/status API actions must remain available.");
assert.ok(adminApi.includes("requireAdmin(request)"), "Admin actions must retain the protected session check.");
console.log("PASS: Admin campaign endpoints remain protected.");

assert.ok(migration.includes("revoke all privileges on table public.momin_giving_campaigns from anon, authenticated;"));
assert.ok(migration.includes("grant select on table public.momin_giving_campaigns to authenticated;"));
assert.ok(migration.includes("revoke all privileges on table public.momin_giving_totals_public from anon, authenticated;"));
assert.ok(migration.includes("grant select on table public.momin_giving_totals_public to authenticated;"));
assert.ok(!/grant\s+(?:all|insert|update|delete)[^;]*\bon\s+(?:table\s+)?public\.momin_giving_campaigns\s+to\s+(?:anon|authenticated)/i.test(migration),
  "Browser roles must not receive campaign write access.");
console.log("PASS: Database migration grants only signed-in read access.");

console.log("MOMIN Admin-to-User Giving integration QA passed.");
