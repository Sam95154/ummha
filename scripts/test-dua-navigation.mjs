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

// Parse all JavaScript files touched by the navigation work.
new vm.Script(parent, { filename: "momin-duas-page-v2.js" });
new vm.Script(shell, { filename: "momin-shared-shell-v1.js" });
new vm.Script(native, { filename: "noor-duas.js" });
const inlineScripts = Array.from(iframe.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi));
assert.ok(inlineScripts.length > 0, "Duas iframe must contain its application script.");
new vm.Script(inlineScripts[inlineScripts.length - 1][1], { filename: "duas-page-v2.html inline script" });
console.log("PASS: Duas navigation JavaScript parses.");

// The iframe keeps its own route history, and Back replaces the current hash rather than
// using history.back() (which could traverse unrelated parent/app history entries).
has(iframe, "var view=$(\\"view\\"),current=\\"home\\",stack=[],scrolls={}", "Duas iframe route stack");
has(iframe, "function navigateLocal(target)", "Deterministic local back navigation");
has(iframe, 'history.replaceState(history.state,"",url);\\n    route();', "Local back replaces the current route and rerenders");
const backStart = iframe.indexOf("  function goBack(){");
const backEnd = iframe.indexOf('  $("back").onclick=goBack;', backStart);
assert.ok(backStart >= 0 && backEnd > backStart, "Duas iframe Back handler must exist.");
assert.ok(!iframe.slice(backStart, backEnd).includes("history.back()"), "Duas iframe Back must not traverse global browser history.");
has(iframe, 'var back=e.target.closest("[data-view-back]");if(back){navigateLocal(back.dataset.viewBack);return}', "Contextual in-page Back buttons");
console.log("PASS: Embedded Duas Back returns through the local catalogue stack.");

// A restored iframe receives its prior route stack when a native dua detail reader closes.
has(iframe, 'new URLSearchParams(location.search).get("routeStack")', "Restore route stack from the parent iframe URL");
has(iframe, "routeStack:stack.slice(-20)", "Publish the current route stack to the parent");
has(parent, 'var stackQuery = Array.isArray(routeStack) && routeStack.length', "Serialize the catalogue route stack into the iframe URL");
has(parent, 'frame.src = PAGE_URL + stackQuery + (targetRoute === "home" ? "" : "#" + targetRoute);', "Restore the prior route stack inside the iframe");
has(parent, "catalogueStack = data.routeStack.map(cleanCatalogueRoute).filter(Boolean).slice(-20)", "Receive and preserve the current iframe route stack");
has(parent, "return renderRoot(catalogueReturnRoute, catalogueStack)", "Return from the native reader to the same catalogue route");
has(parent, "var index = catalogueStack.lastIndexOf(catalogueReturnRoute)", "Align the return stack to the clicked category");
console.log("PASS: Native dua reader restores the exact previous catalogue path.");

// The shared header Back and the Duas root Back both use the app's route stack.
// A native reader Back returns to its catalogue rather than blindly popping browser history.
has(shell, 'if(action==="back"){back();}', "Shared header Back delegates to one handler");
has(shell, "function back(){", "Shared app Back handler");
has(shell, 'var isDuaReader=hash.indexOf("#/dua-category/")===0||hash.indexOf("#/dua-chapter/")===0||', "Native reader route detection");
has(shell, 'duasApi.returnToCatalogue();scheduleSync();return true;', "Shared Back returns native reader to its catalogue");
has(shell, "var previous=routeStack.pop();\\n      navigate(previous,true);return true;", "Shared Back pops the actual previously visited app route");
has(shell, "back:back,currentRoute:routeNow", "Public shared-shell Back API");
has(parent, "return window.MominSharedShellV1.back()", "Duas root Back uses the actual previous app tab/section");
console.log("PASS: Duas navigation and the outer MOMIN app navigation remain separate and synchronized.");

// Align the collection rail instead of showing a cut-off second card on phone.
has(iframe, ".rail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;overflow:visible;", "Phone collection rail is an aligned two-column grid");
has(iframe, "@media(min-width:701px){.rail{grid-template-columns:repeat(3,minmax(0,1fr))}}", "Tablet and desktop collection grid");
assert.ok(!iframe.includes(".rail{display:flex;gap:14px;overflow-x:auto"), "The home collection rail must not be horizontally clipped.");
console.log("PASS: Duas collection cards fit the phone width and align on larger screens.");

has(index, "momin-duas-page-v2.js?v=20261104-dua-navigation-layout-v1", "Fresh Duas bridge cache key");
has(index, "momin-shared-shell-v1.js?v=20261104-dua-navigation-layout-v1", "Fresh shared shell cache key");
console.log("MOMIN Duas navigation and layout QA passed.");
