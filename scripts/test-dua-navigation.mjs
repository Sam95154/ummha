import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const iframe = read("duas-page-v2.html");
const parent = read("momin-duas-page-v2.js");
const shell = read("momin-shared-shell-v1.js");
const native = read("noor-duas.js");
const index = read("index.html");

function has(source, value, label) {
  assert.ok(source.includes(value), label + " missing: " + value);
}

// Parse the parent, shared shell, native detail reader and the embedded iframe application.
new vm.Script(parent, { filename: "momin-duas-page-v2.js" });
new vm.Script(shell, { filename: "momin-shared-shell-v1.js" });
new vm.Script(native, { filename: "noor-duas.js" });
const inlineScripts = Array.from(iframe.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
  .map((match) => match[1])
  .filter((source) => source.trim().length > 0);
assert.ok(inlineScripts.length > 0, "Duas iframe must contain its application script.");
new vm.Script(inlineScripts[inlineScripts.length - 1], { filename: "duas-page-v2.html inline script" });
console.log("PASS: Duas navigation JavaScript parses.");

// The iframe keeps its own route history and uses it for Back instead of global history.back().
has(iframe, 'var view=$("view"),current="home",stack=[],scrolls={}', "Duas iframe route stack");
has(iframe, "function navigateLocal(target)", "Deterministic local back navigation");
has(iframe, 'history.replaceState(history.state,"",url);', "Local Back replaces the iframe route");
has(iframe, "route();", "Local Back rerenders the previous route");
const backStart = iframe.indexOf("  function goBack(){");
const backEnd = iframe.indexOf('  $("back").onclick=goBack;', backStart);
assert.ok(backStart >= 0 && backEnd > backStart, "Duas iframe Back handler must exist.");
assert.ok(!iframe.slice(backStart, backEnd).includes("history.back()"), "Duas iframe Back must not traverse parent/browser history.");
has(iframe, 'var back=e.target.closest("[data-view-back]");if(back){navigateLocal(back.dataset.viewBack);return}', "Contextual in-page Back buttons");
console.log("PASS: Embedded Duas Back follows the local route stack.");

// Preserve the exact catalogue route stack while the native full-screen dua reader is open.
has(iframe, 'new URLSearchParams(location.search).get("routeStack")', "Restore route stack from the iframe URL");
has(iframe, "routeStack:stack.slice(-20)", "Send route stack updates to the parent");
has(parent, "var stackQuery = Array.isArray(routeStack) && routeStack.length", "Serialize route stack in iframe URL");
has(parent, 'frame.src = PAGE_URL + stackQuery + (targetRoute === "home" ? "" : "#" + targetRoute);', "Open iframe at its previous route");
has(parent, "catalogueStack = data.routeStack.map(cleanCatalogueRoute).filter(Boolean).slice(-20)", "Receive iframe route stack");
has(parent, "return renderRoot(catalogueReturnRoute, catalogueStack)", "Restore the exact catalogue route after the native reader");
has(parent, "var index = catalogueStack.lastIndexOf(catalogueReturnRoute)", "Align return stack to the clicked category");
has(parent, "renderRoot(catalogueReturnRoute, catalogueStack);", "Keep catalogue route when the parent rerenders");
console.log("PASS: Native dua reader returns to the actual collection/category path.");

// The shared app header Back handles the native reader locally, then pops the actual prior app route.
has(shell, 'if(action==="back"){back();}', "Shared header Back uses the central Back handler");
has(shell, "function back(){", "Shared app Back handler");
has(shell, 'hash.indexOf("#/dua-detail/")===0', "Native dua detail route detection");
has(shell, "duasApi.returnToCatalogue();scheduleSync();return true;", "Return from native reader to its embedded catalogue");
has(shell, "var previous=routeStack.pop();", "Shared Back pops the prior app route");
has(shell, "navigate(previous,true);return true;", "Shared Back restores the prior app route");
has(shell, "back:back,currentRoute:routeNow", "Expose shared Back action to Duas root");
has(parent, "return window.MominSharedShellV1.back()", "Duas root Back uses shared app route history");
has(parent, 'window.MominSharedShellV1.navigate(target);', "Duas app-section navigation uses the shared route stack");
has(shell, "function recordRoute(target){", "Shared shell can record direct route entries");
has(shell, "recordRoute:recordRoute,currentRoute:routeNow", "Expose shared route recorder");
has(native, 'window.MominSharedShellV1.recordRoute("duas")', "Direct native entry into Duas records its actual previous app page");
has(native, "window.MominSharedShellV1.navigate(target);", "Leaving native Duas updates shared app history");
console.log("PASS: Inner Duas navigation and outer MOMIN navigation stay in their own stacks.");

// The collection teaser rail is a responsive grid, not a horizontally clipped carousel.
has(iframe, ".rail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;overflow:visible;", "Phone collection grid");
has(iframe, "@media(min-width:701px){.rail{grid-template-columns:repeat(3,minmax(0,1fr))}}", "Tablet/desktop collection grid");
assert.ok(!iframe.includes(".rail{display:flex;gap:14px;overflow-x:auto"), "The collection rail must not be horizontally clipped.");
console.log("PASS: Duas cards fit and align across phone, tablet and desktop.");

has(index, "momin-duas-page-v2.js?v=20261104-dua-navigation-layout-v1", "Fresh Duas bridge cache key");
has(index, "momin-shared-shell-v1.js?v=20261104-dua-navigation-layout-v1", "Fresh shared-shell cache key");
console.log("MOMIN Duas navigation and layout QA passed.");
