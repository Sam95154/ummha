import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
  console.log((condition ? "PASS " : "FAIL ") + message);
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "www", "android", "ios"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile()) output.push(full);
  }
  return output;
}

function isExternal(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value.trim());
}

function resolveLocalReference(page, rawValue) {
  const value = rawValue.trim();
  if (!value || value.startsWith("#") || isExternal(value) ||
      value.startsWith("$" + "{") || value.includes("{{") || value.includes("}}") ||
      (/^["']\s*\+/.test(value) && /\b(?:esc|String)\s*\(/.test(value))) return null;
  let pathname = value.split(/[?#]/, 1)[0];
  if (!pathname) return null;
  try { pathname = decodeURIComponent(pathname); } catch { /* keep original path */ }
  const candidate = pathname.startsWith("/")
    ? path.join(ROOT, pathname.replace(/^\/+/, ""))
    : path.resolve(ROOT, path.dirname(page), pathname);
  if (pathname.endsWith("/")) return path.join(candidate, "index.html");
  return candidate;
}

const htmlPages = fs.readdirSync(ROOT)
  .filter((name) => name.toLowerCase().endsWith(".html") &&
    fs.statSync(path.join(ROOT, name)).isFile())
  .sort();

check(htmlPages.length > 0, "Root HTML pages are present");
const localAssetRefs = [];
for (const name of htmlPages) {
  const html = fs.readFileSync(path.join(ROOT, name), "utf8");
  check(/<meta\b(?=[^>]*\bname\s*=\s*["']viewport["'])[^>]*>/i.test(html),
    name + " declares a responsive viewport");
  check(/<link\b(?=[^>]*\bhref\s*=\s*["'][^"']*momin-responsive-v1\.css(?:\?[^"']*)?["'])[^>]*>/i.test(html),
    name + " loads the shared responsive stylesheet");

  const tags = /<(script|link|img|iframe|audio|source|video)\b([^>]*)>/gi;
  let tagMatch;
  while ((tagMatch = tags.exec(html))) {
    const tagName = tagMatch[1].toLowerCase();
    const attrPattern = /\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi;
    let attrMatch;
    while ((attrMatch = attrPattern.exec(tagMatch[2]))) {
      const candidate = resolveLocalReference(name, attrMatch[3]);
      if (candidate) localAssetRefs.push({ page: name, tag: tagName, value: attrMatch[3], candidate });
    }
  }
}

for (const ref of localAssetRefs) {
  check(fs.existsSync(ref.candidate) && fs.statSync(ref.candidate).isFile(),
    ref.page + " local " + ref.tag + " asset exists: " + ref.value);
}

const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const responsiveCssPath = path.join(ROOT, "momin-responsive-v1.css");
const shellPath = path.join(ROOT, "momin-shared-shell-v1.js");
check(fs.existsSync(responsiveCssPath), "Shared responsive stylesheet exists");
check(fs.existsSync(shellPath), "Shared navigation shell exists");

if (fs.existsSync(responsiveCssPath)) {
  const css = fs.readFileSync(responsiveCssPath, "utf8");
  check(/@media\s*\(\s*min-width\s*:\s*601px\s*\)\s*and\s*\(\s*max-width\s*:\s*1024px\s*\)/i.test(css),
    "Tablet breakpoint covers 601px–1024px");
  check(/@media\s*\(\s*min-width\s*:\s*1025px\s*\)/i.test(css),
    "Desktop breakpoint starts at 1025px");
  check(/@media\s*\(\s*min-width\s*:\s*1440px\s*\)/i.test(css),
    "Large desktop breakpoint starts at 1440px");
  check(/env\(\s*safe-area-inset-bottom/i.test(css),
    "Responsive styles account for device safe areas");
  check(/#momin-shared-bottom-nav-v1/.test(css),
    "Responsive styles include the shared bottom navigation");
}
check(/@media\s*\(\s*max-width\s*:\s*700px\s*\)/i.test(indexHtml),
  "Main app retains a dedicated phone breakpoint");

const homeModulePath = path.join(ROOT, "momin-home-design-v2.js");
if (fs.existsSync(homeModulePath)) {
  const homeModule = fs.readFileSync(homeModulePath, "utf8");
  const marker = 'data-name="Journey"';
  const markerAt = homeModule.indexOf(marker);
  const buttonEnd = markerAt >= 0 ? homeModule.indexOf("</button>", markerAt) : -1;
  const buttonSource = markerAt >= 0 && buttonEnd >= 0 ? homeModule.slice(markerAt, buttonEnd) : "";
  check(markerAt >= 0 && buttonSource.toLowerCase().includes("journey") && !buttonSource.includes("profile"),
    "Home fallback Journey tab routes to Journey, not Profile");
}
check(/momin-home-v3-active/.test(css) && /grid-template-areas/.test(css),
  "Home dashboard has responsive tablet and desktop grid layouts");
check(/\.tabs nav[\s\S]*?flex-direction:\s*column/i.test(css),
  "Desktop Home navigation adapts into a vertical rail");
if (fs.existsSync(shellPath)) {
  const shell = fs.readFileSync(shellPath, "utf8");
  check(/aria-label=["']Primary navigation["']/.test(shell) || /setAttribute\(["']aria-label["']\s*,\s*["']Primary navigation["']\)/.test(shell),
    "Shared tab navigation has an accessible name");
  check(/aria-current=/.test(shell),
    "Shared tab navigation marks the active destination");
  for (const [route, label] of [["home","Home"],["prayers","Prayers"],["quran","Quran"],["journey","Journey"]]) {
    check(shell.includes('["' + route + '","' + label + '"]'),
      "Shared tab navigation contains " + label);
  }
}

const sourceFiles = walk(ROOT)
  .filter((file) => /\.(?:js|mjs|cjs)$/i.test(file))
  .filter((file) => !file.includes(path.sep + "test-results" + path.sep))
  .sort();

check(sourceFiles.length > 0, "JavaScript source files are present");
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    cwd: ROOT,
    input: source,
    encoding: "utf8"
  });
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  const details = (result.stderr || result.stdout || "").trim();
  check(result.status === 0, relative + " JavaScript syntax" + (details ? ": " + details : ""));
}

const manifestPath = path.join(ROOT, "manifest.webmanifest");
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    check(Array.isArray(manifest.icons) && manifest.icons.length > 0,
      "PWA manifest declares app icons");
    for (const icon of manifest.icons || []) {
      const candidate = resolveLocalReference("manifest.webmanifest", icon.src || "");
      if (candidate) check(fs.existsSync(candidate),
        "PWA manifest icon exists: " + icon.src);
    }
  } catch (error) {
    check(false, "PWA manifest is valid JSON: " + error.message);
  }
}

console.log("\nResponsive QA summary: " + (checks - failures.length) + "/" + checks + " checks passed; " +
  failures.length + " failed; " + htmlPages.length + " HTML pages; " +
  localAssetRefs.length + " local HTML asset references; " + sourceFiles.length + " JS source files checked.");
if (failures.length) process.exitCode = 1;
