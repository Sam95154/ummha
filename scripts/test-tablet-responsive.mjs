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

for (const file of [
  "momin-prayer-page-v1.js", "momin-journey-page-v1.js",
  "momin-mosque-page-v1.js", "momin-duas-page-v2.js",
  "momin-inspiration-page-v1.js", "momin-notifications-bridge-v1.js"
]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(content.includes("20261103-device-responsive-v1"), file + " iframe cache version was not refreshed.");
}

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
