import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [home, prayer, prayerPage, index] = await Promise.all([
  read("../momin-home-design-v2.js"),
  read("../prayers-page-v1.html"),
  read("../momin-prayer-page-v1.js"),
  read("../index.html"),
]);

// Home hero shows the location-based Sunrise time as a display-only chip.
assert.match(home, /var sunrise=parsePrayerDate\(timings\.Sunrise,0\)/);
assert.match(home, /chips\.splice\(1,0,[\s\S]*?Sunrise · /);
assert.match(home, /aria-label="Sunrise time, informational only"/);

// The tracker still counts only the five salah names.
assert.match(home, /function prayerNames\(\)\{return \['Fajr','Dhuhr','Asr','Maghrib','Isha'\];\}/);
assert.match(home, /function doneCount\(\)\{var done=doneMap\(\);return prayerNames\(\)\.filter/);

// Prayer page renders Sunrise as a separate informational row, not a checkbox.
assert.match(prayer, /var P=\[\],sunriseM=null;/);
assert.match(prayer, /sunriseM=mominMinutes\(timings\.Sunrise\)/);
assert.match(prayer, /data-prayer-index=/, "Prayer chips must carry their original five-prayer index");
assert.match(prayer, /#chips \\[data-prayer-index\\]/, "Active-prayer highlighting must exclude the Sunrise display chip");
const rowsStart = prayer.indexOf("function rows(anim){");
const statsStart = prayer.indexOf("function stats(fx){", rowsStart);
assert.ok(rowsStart >= 0 && statsStart > rowsStart, "Prayer rows renderer must exist");
const rowsRenderer = prayer.slice(rowsStart, statsStart);
const sunriseRowMatch = rowsRenderer.match(/renderedRows\\.splice\\(1,0,([\\s\\S]*?)\\);/);
assert.ok(sunriseRowMatch, "Sunrise must be inserted as its own row");
assert.match(sunriseRowMatch[1], /class="row sunrise-info" role="group"/);
assert.match(sunriseRowMatch[1], /Sunrise/);
assert.doesNotMatch(sunriseRowMatch[1], /<button|role="checkbox"|class="ck"|togglePrayer/);
assert.match(prayer, /function stats\(fx\)\{var n=done\.length;.*n\+" of 5"/);

// All client entry points use the new cache version so the UI refreshes.
assert.match(index, /momin-home-design-v2\.js\?v=20261103-sunrise-time-v1/);
assert.match(index, /momin-prayer-page-v1\.js\?v=20261103-sunrise-time-v1/);
assert.match(prayerPage, /prayers-page-v1\.html\?embed=1&amp;v=20261103-sunrise-time-v1/);

console.log("MOMIN Sunrise display QA passed.");
