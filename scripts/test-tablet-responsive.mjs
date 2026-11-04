import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const stylesheetPath = path.join(root, "momin-tablet-responsive-v1.css");
const css = fs.readFileSync(stylesheetPath, "utf8");
const stylesheetUrl = "momin-tablet-responsive-v1.css?v=20261102-tablet-v1";
const deviceStylesheetPath = path.join(root, "momin-device-responsive-v1.css");
const deviceCss = fs.readFileSync(deviceStylesheetPath, "utf8");
const deviceStylesheetUrl = "momin-device-responsive-v1.css?v=20261103-device-responsive-v1";

function assertBalancedCss(source) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inComment = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      inComment = true;
      i++;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      assert.ok(depth >= 0, "CSS has an unexpected closing brace.");
    }
  }

  assert.equal(depth, 0, "CSS has unclosed braces.");
  assert.equal(quote, null, "CSS has an unclosed string.");
  assert.equal(inComment, false, "CSS has an unclosed comment.");
}

assertBalancedCss(css);
assertBalancedCss(deviceCss);

for (const breakpoint of [
  "@media screen and (min-width: 701px)",
  "@media screen and (min-width: 701px) and (max-width: 900px)",
  "@media screen and (min-width: 901px) and (max-width: 1366px)",
  "@media screen and (min-width: 1367px)"
]) {
  assert.ok(css.includes(breakpoint), "Missing expected responsive breakpoint: " + breakpoint);
}

assert.ok(css.includes("body.momin-home-v3-active .app > main"), "Home dashboard tablet grid is missing.");
assert.ok(css.includes("body.momin-settings-v2-active .momin-sc-groups"), "Settings tablet grid is missing.");
assert.ok(css.includes(".momin-shell-header__inner"), "Shared tablet header rules are missing.");
assert.ok(css.includes(".momin-shell-bottom-nav"), "Shared tablet navigation rules are missing.");
assert.ok(css.includes(".quran-reader"), "Quran reader tablet rules are missing.");
assert.ok(css.includes(".momin-prayer-page-frame-wrap"), "Prayer iframe tablet sizing is missing.");
assert.ok(!/@media[^\{]*max-width\s*:\s*(?:700|600|520|480)px/i.test(css), "Tablet stylesheet must not redefine the phone breakpoints.");

for (const file of ["index.html", "login.html", "founder.html", "prayers-page-v1.html"]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(content.includes(stylesheetUrl), file + " is missing the shared tablet stylesheet.");
  if (file === "index.html" || file === "prayers-page-v1.html") {
    assert.ok(content.includes(deviceStylesheetUrl), file + " is missing the automatic device-responsive stylesheet.");
  }
}

for (const file of [
  "journey-page-v1.html", "prayers-page-v1.html", "mosques-page-v1.html",
  "duas-page-v2.html", "duas-page-v1.html", "inspiration-page-v1.html",
  "islamic-calendar-reference.html", "notifications.html"
]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(content.includes(deviceStylesheetUrl), file + " is missing device-responsive styles for its embedded view.");
}

const frameCacheVersions = new Map([
  ["momin-prayer-page-v1.js", "20261103-sunrise-time-v1"],
  ["momin-journey-page-v1.js", "20261103-device-responsive-v1"],
  ["momin-mosque-page-v1.js", "20261103-device-responsive-v1"],
  ["momin-duas-page-v2.js", "20261104-dua-navigation-layout-v1"],
  ["momin-inspiration-page-v1.js", "20261103-device-responsive-v1"]
]);
for (const [file, version] of frameCacheVersions) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(content.includes(version), file + " iframe cache version was not refreshed.");
}
const notificationBridge = fs.readFileSync(path.join(root, "momin-notifications-admin-inbox-v1.js"), "utf8");
assert.ok(notificationBridge.includes('notifications.html?v=20261103-recent-top-v1'), "Notifications iframe must use a fresh cache key for the top-Recent layout.");

const sharedShell = fs.readFileSync(path.join(root, "momin-shared-shell-v1.js"), "utf8");
assert.ok(sharedShell.includes("data-momin-device"), "Automatic device-width detection is missing.");
assert.ok(sharedShell.includes("syncDeviceClass"), "Device width synchronization is missing.");
assert.ok(sharedShell.includes('window.addEventListener("resize",syncDeviceClass'), "Device detection must update when the viewport resizes.");
assert.ok(sharedShell.includes('window.addEventListener("orientationchange",syncDeviceClass'), "Device detection must update when the screen rotates.");
assert.ok(
  sharedShell.includes("body.momin-app-shell-active #view.content") &&
  sharedShell.includes("width:calc(100% - 48px)!important") &&
  sharedShell.includes("body.momin-app-shell-active .app") &&
  sharedShell.includes("width:100%!important"),
  "Outer shell should set tablet gutters and nested app content should fill that canvas."
);
assert.ok(
  deviceCss.includes("body.momin-app-shell-active #view.content") &&
  deviceCss.includes("width: calc(100% - 48px) !important;") &&
  deviceCss.includes("body.momin-app-shell-active .app") &&
  deviceCss.includes("width: 100% !important;"),
  "Device stylesheet must reserve one outer gutter and let the nested page fill it."
);

const notificationsPage = fs.readFileSync(path.join(root, "notifications.html"), "utf8");
const recentHeading = notificationsPage.indexOf('<div class="sec rise" style="--d:1"><h3>Recent</h3>');
const recentContainer = notificationsPage.indexOf('<div id="recent"></div>');
const remindersHero = notificationsPage.indexOf('<section class="hero rise" style="--d:2" id="hero"');
const prayerTimeline = notificationsPage.indexOf('<section class="card rise" style="--d:3">');
assert.ok(recentHeading >= 0, "Recent notifications heading must be the first Notifications content section.");
assert.ok(recentContainer > recentHeading, "Recent notification list must follow its heading.");
assert.ok(remindersHero > recentContainer, "Recent notifications must appear above the reminders summary.");
assert.ok(prayerTimeline > remindersHero, "Prayer timeline must remain below the reminder summary.");
assert.equal((notificationsPage.match(/id="recent"/g) || []).length, 1, "Notifications page must contain exactly one Recent list.");
assert.equal((notificationsPage.match(/id="clr"/g) || []).length, 1, "Notifications page must keep exactly one Clear all control.");
assert.ok(notificationsPage.includes('data-mark-read'), "Recent messages must retain their mark-as-read action.");
assert.ok(notificationsPage.includes('m.inboxId&&m.unread'), "Unread admin announcements must retain their read control.");
assert.ok(notificationsPage.includes('window.addEventListener("focus",function(){refreshPageFromBridge();refreshNativeNotificationStatus()})'), "Recent inbox must continue refreshing when the Notifications page regains focus.");

const capacitorPrep = fs.readFileSync(path.join(root, "scripts/prepare-android-web.mjs"), "utf8");
assert.ok(capacitorPrep.includes('copyAppFiles(root, webDir)'), "Android bundle must copy the shared stylesheet with app assets.");

console.log("MOMIN automatic device-responsive QA passed.");
console.log("- CSS syntax structure is balanced.");
console.log("- Phone, tablet and desktop breakpoints are present.");
console.log("- All requested feature views and embedded iframes load the responsive rules.");
console.log("- Device width and orientation are detected automatically and refreshed on resize.");
console.log("- Home, Settings, shared shell, Quran and Prayer layouts have tablet rules.");
console.log("- Main, login, Founder and Prayer pages load the shared stylesheet.");
console.log("- Android web bundling includes the stylesheet.");
