import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const html = read("index.html");
const app = read("noor-v5.js");
const home = read("momin-home-design-v2.js");
const complaints = read("momin-giving-complaints-v1.js");
const shell = read("momin-shared-shell-v1.js");
const notificationBridge = read("momin-notifications-admin-inbox-v1.js");
const notificationRouting = read("momin-notifications-bridge-v1.js");
const serviceWorker = read("momin-sw.js");
const api = read("supabase/functions/momin-admin-api/index.ts");
const privacy = read("privacy.html");
const terms = read("terms.html");
const pkg = JSON.parse(read("package.json"));
const androidPrep = read("scripts/prepare-android-project.mjs");

// User navigation and home shortcuts do not expose a Giving screen.
assert.doesNotMatch(html, /\[['"]giving['"]\s*,/i, "Main navigation and home shortcuts must not contain a Giving route entry.");
assert.doesNotMatch(html, /giving:givingPage|function givingPage\s*=/i, "The main app must not render a Giving page.");
assert.doesNotMatch(app, /\[['"]giving['"]\s*,|giving:givingPage|giving:'Giving'/i, "Secondary navigation and page maps must not expose Giving.");
assert.doesNotMatch(home, /\[['"]Giving['"][^\]]*['"]giving['"]\]/i, "Home feature tiles must not expose Giving.");
assert.match(html, /if\(allowed\.indexOf\(route\)<0\)return/, "The main app must reject old push destinations outside its allow-list.");
const routeAllowList = html.match(/var allowed=\[([^\]]+)\]/);
assert.ok(routeAllowList, "Main app push route allow-list must be present.");
assert.doesNotMatch(routeAllowList[1], /["']giving["']/i, "Old Giving push notifications must not navigate to a disabled route.");
assert.doesNotMatch(notificationBridge, /["']giving["']/i, "Notification inbox must not accept a Giving deep link.");
assert.doesNotMatch(notificationRouting, /["']giving["']/i, "Notification routing bridge must not accept a Giving deep link.");
assert.doesNotMatch(serviceWorker, /["']giving["']/i, "Service worker must not accept a Giving deep link.");
assert.doesNotMatch(shell, /giving\s*:\s*["']Giving["']/i, "Shared navigation titles must not advertise Giving.");
console.log("PASS: Giving is absent from navigation, shortcuts, route maps and notification destinations.");

// Complaints remains independent and continues to use the authenticated complaint stores.
new vm.Script(complaints, { filename: "momin-giving-complaints-v1.js" });
assert.match(complaints, /window\.MominComplaintsV1/, "Complaint-only module export must remain available.");
assert.match(complaints, /momin_complaints/, "Complaint records must still load and submit.");
assert.match(complaints, /momin_complaint_replies/, "Complaint reply history must remain available.");
assert.match(complaints, /momin-complaint-attachments/, "Complaint attachments must remain available.");
assert.match(complaints, /submitComplaint/, "User complaint submission must remain wired.");
assert.doesNotMatch(complaints, /giving|donat|campaign|contribution/i, "The shared User module must contain complaints only.");
console.log("PASS: Complaint submission, history, replies and private attachments remain in the User module.");

// Server-side campaign and contribution actions are blocked; historical tables are not queried or deleted.
assert.match(api, /const allowed = \[[^\]]*"complaints"[^\]]*\]/, "Server notification destination allow-list must retain Complaints.");
assert.doesNotMatch(api.slice(api.indexOf("function safeRoute"), api.indexOf("async function audit")), /["']giving["']/i, "Server route allow-list must reject Giving.");
assert.match(api, /case "campaigns":[\s\S]*?case "contributions": return reply\(\{ error: "Giving is temporarily disabled in this release\." \}, 410, origin\)/,
  "Legacy campaign and contribution API actions must return HTTP 410.");
assert.doesNotMatch(api, /db\.from\(["']momin_giving_campaigns["']\)/i, "API must not query campaign records in this release.");
assert.doesNotMatch(api, /db\.from\(["']momin_contributions["']\)/i, "API must not query or expose contribution records in this release.");
assert.match(api, /requestedCategory === "Giving" \? "Other"/, "Legacy complaint category must be normalized to Other.");
assert.doesNotMatch(api, /\.delete\(\)|DROP TABLE|TRUNCATE/i, "Release API must not delete historical rows or tables.");
console.log("PASS: Backend blocks fundraising actions and preserves historical database records.");

// Public policy pages accurately describe the disabled feature and historical data retention.
assert.match(privacy, /Giving campaigns, fundraising, donation instructions and contribution tracking are disabled/i);
assert.match(privacy, /Historical financial records/i);
assert.match(privacy, /may be retained for accounting, audit/i);
assert.doesNotMatch(terms, /MOMIN may display information about .*giving campaigns/i);
assert.match(terms, /does not offer fundraising, crowdfunding, giving campaigns/i);
console.log("PASS: Privacy and Terms do not advertise active fundraising and accurately describe retained records.");

// The new Android bundle has an explicit release identity, while existing profile saving remains in the release suite.
assert.equal(pkg.version, "1.0.2", "Package version name must be 1.0.2.");
assert.ok(androidPrep.includes("versionCode\\s*"), "Android Gradle versionCode patch uses a whitespace-tolerant Gradle matcher.");
assert.ok(androidPrep.includes("versionName\\s*"), "Android Gradle versionName patch uses a whitespace-tolerant Gradle matcher.");
assert.match(androidPrep, /versionCode.*"3"/);
assert.match(androidPrep, /1\.0\.2/);
assert.match(complaints, /momin_complaints/);
console.log("PASS: Android version is set to code 3 / name 1.0.2; complaint integration is preserved.");

console.log("MOMIN personal-account no-Giving release QA passed.");
