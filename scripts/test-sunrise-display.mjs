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
const trackerStart = home.indexOf("function trackerMarkup(state){");
const featureStart = home.indexOf("function featureMarkup(){", trackerStart);
assert.ok(trackerStart >= 0 && featureStart > trackerStart, "Home prayer tracker renderer must exist");
const homeTracker = home.slice(trackerStart, featureStart);
assert.match(homeTracker, /var sunrise=parsePrayerDate\(timings\.Sunrise,0\)/);
assert.ok(homeTracker.includes('class="row sunrise-info" role="group"'), "Home tracker must insert Sunrise as an informational row");
const homeSunriseStart = homeTracker.indexOf("rows.splice(1,0,");
const homeSunriseEnd = homeTracker.indexOf(");", homeSunriseStart);
assert.ok(homeSunriseStart >= 0 && homeSunriseEnd > homeSunriseStart, "Home tracker Sunrise row must be present");
const homeSunriseRow = homeTracker.slice(homeSunriseStart, homeSunriseEnd);
assert.ok(homeSunriseRow.includes("Sunrise"));
assert.doesNotMatch(homeSunriseRow, /<button|role="checkbox"|class="chk"|togglePrayer/);


// Prayer page renders Sunrise as a separate informational row, not a checkbox.
assert.match(prayer, /var P=\[\],sunriseM=null;/);
assert.match(prayer, /sunriseM=mominMinutes\(timings\.Sunrise\)/);
assert.match(prayer, /data-event-name=/, "Prayer timeline chips must identify each event by name");
assert.ok(prayer.includes('document.querySelectorAll("#chips [data-event-name]")'), "Active-event highlighting must include Sunrise");
const rowsStart = prayer.indexOf("function rows(anim){");
const statsStart = prayer.indexOf("function stats(fx){", rowsStart);
assert.ok(rowsStart >= 0 && statsStart > rowsStart, "Prayer rows renderer must exist");
const rowsRenderer = prayer.slice(rowsStart, statsStart);
const sunriseRowStart = rowsRenderer.indexOf('renderedRows.splice(1,0,');
const sunriseRowEnd = rowsRenderer.indexOf(");", sunriseRowStart);
assert.ok(sunriseRowStart >= 0 && sunriseRowEnd > sunriseRowStart, "Sunrise must be inserted as its own row");
const sunriseRowMarkup = rowsRenderer.slice(sunriseRowStart, sunriseRowEnd);
assert.ok(sunriseRowMarkup.includes('class="row sunrise-info" role="group"'));
assert.ok(sunriseRowMarkup.includes("Sunrise"));
assert.doesNotMatch(sunriseRowMarkup, /<button|role="checkbox"|class="ck"|togglePrayer/);
assert.match(prayer, /function stats\(fx\)\{var n=done\.length;.*n\+" of 5"/);

// All client entry points use the new cache version so the UI refreshes.
assert.match(index, /momin-home-design-v2\.js\?v=20261105-sunrise-prayer-sequence-v1/);
assert.match(index, /momin-prayer-page-v1\.js\?v=20261105-sunrise-prayer-sequence-v1/);
assert.match(prayerPage, /prayers-page-v1\.html\?embed=1&amp;v=20261105-sunrise-prayer-sequence-v1/);

console.log("MOMIN Sunrise display QA passed.");
