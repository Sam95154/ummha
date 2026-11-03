import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [app, prayerPage, prayerBridge, home, index] = await Promise.all([
  read("../noor-v5.js"),
  read("../prayers-page-v1.html"),
  read("../momin-prayer-page-v1.js"),
  read("../momin-home-design-v2.js"),
  read("../index.html"),
]);

// A previously GPS-selected location is refreshed from the current device
// when geolocation permission is already granted. Manual city choices remain city-based.
assert.match(app, /function useCurrentLocationV5\(options\)/);
assert.match(app, /getCurrentPosition\(async function\(pos\)/);
assert.match(app, /enableHighAccuracy:true,maximumAge:0,timeout:20000/);
const startupStart = app.indexOf("function startAutomaticLocationV6(){");
const startupEnd = app.indexOf("API_STORE.latitude=null;API_STORE.longitude=null;", startupStart);
assert.ok(startupStart >= 0 && startupEnd > startupStart, "Automatic location bootstrap must exist");
const startup = app.slice(startupStart, startupEnd);
assert.ok(startup.includes('localStorage.getItem("noor-location-source")==="gps"'));
assert.ok(startup.includes('permission.state==="granted")useCurrentLocationV5({silent:true})'));
assert.ok(startup.includes("else restoreSavedGpsV6()"));
assert.ok(startup.includes("if(city&&country)"), "Saved manual city location must remain supported");

// Verify the final/active prayer loader uses the same coordinates, method and
// Asr school for the full prayer schedule, including Sunrise.
const loaderStart = app.lastIndexOf("loadPrayerData=async function(){");
const loaderEnd = app.indexOf("applyPrayerSettings=function(){", loaderStart);
assert.ok(loaderStart >= 0 && loaderEnd > loaderStart, "Active prayer timing loader must exist");
const loader = app.slice(loaderStart, loaderEnd);
assert.match(loader, /timings\/\+apiDate\(\)\+.*latitude=.*API_STORE\.latitude.*longitude=.*API_STORE\.longitude/s);
assert.match(loader, /timingsByCity\/\+apiDate\(\).*city=.*city.*country=.*country/s);
assert.match(loader, /school=localStorage\.getItem\("noor-asr-method"\)==="hanafi"\?"1":"0"/);
assert.match(loader, /&school=/);
assert.match(loader, /livePrayer=result\.data/);
assert.match(loader, /school:school/);
assert.match(loader, /cached\.school\|\|"0"\)===school/);

// Main app, Home and the Prayer page iframe all consume the same live timings.
assert.match(prayerBridge, /return typeof livePrayer !== "undefined" && livePrayer && livePrayer\.timings \? livePrayer : null/);
assert.match(prayerBridge, /timings: data \? data\.timings : null/);
assert.match(home, /function prayerTimings\(\)\{var data=livePrayerData\(\);return data&&data\.timings\?data\.timings:null;\}/);
assert.match(home, /parsePrayerDate\(timings\.Sunrise,0\)/);
assert.match(home, /prayerNames\(\)\.map/);

// Prayer Times reads the same parent timing data and refreshes when Sunrise
// changes too, even if the five salah values remain unchanged.
assert.match(prayerPage, /sunriseM=mominMinutes\(timings\.Sunrise\)/);
assert.match(prayerPage, /Sunrise:\\?"?\+mominMinutes\(state\.timings\.Sunrise\)/);
assert.match(prayerPage, /mominApplyPrayerData\(state\);tick\(\);rows\(false\)/);

// New cache key prevents devices from loading the old location startup logic.
assert.match(index, /noor-v5\.js\?v=20261103-current-location-prayer-sync-v1/);

console.log("MOMIN current-location prayer timing QA passed.");
