import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const [home, prayer, bridge, index] = await Promise.all([
  read("momin-home-design-v2.js"),
  read("prayers-page-v1.html"),
  read("momin-prayer-page-v1.js"),
  read("index.html"),
]);

const names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const timings = {
  Fajr: "4:59 AM",
  Sunrise: "6:12 AM",
  Dhuhr: "12:00 PM",
  Asr: "3:20 PM",
  Maghrib: "5:47 PM",
  Isha: "7:00 PM",
};

let homeNow = new Date(2026, 10, 5, 5, 30, 0);
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [homeNow.getTime()]));
  }
}
function parsePrayerDate(raw, offset) {
  const match = String(raw || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const suffix = String(raw).match(/\b(AM|PM)\b/i);
  let hour = Number(match[1]);
  if (suffix) hour = hour % 12 + (suffix[1].toUpperCase() === "PM" ? 12 : 0);
  const date = new FixedDate();
  date.setDate(date.getDate() + (offset || 0));
  date.setHours(hour, Number(match[2]), 0, 0);
  return date;
}

const homeStart = home.indexOf("function prayerState(){");
const homeEnd = home.indexOf("function hijriParts", homeStart);
assert.ok(homeStart >= 0 && homeEnd > homeStart, "Home prayerState() must exist.");
const homeContext = vm.createContext({
  Date: FixedDate,
  Math,
  prayerTimings: () => timings,
  prayerNames: () => names,
  parsePrayerDate,
});
vm.runInContext(home.slice(homeStart, homeEnd) + "\nglobalThis.getHomePrayerState = prayerState;", homeContext);

function checkHome(hour, minute, current, next, prayerIndex) {
  homeNow = new Date(2026, 10, 5, hour, minute, 0);
  const state = homeContext.getHomePrayerState();
  assert.equal(state.current, current, "Home current event at " + hour + ":" + minute);
  assert.equal(state.next, next, "Home next event at " + hour + ":" + minute);
  if (prayerIndex !== undefined) assert.equal(state.currentIndex, prayerIndex);
}

checkHome(4, 0, "Isha", "Fajr", 4);
checkHome(5, 30, "Fajr", "Sunrise", 0);
checkHome(6, 12, "Sunrise", "Dhuhr", -1);
checkHome(10, 55, "Sunrise", "Dhuhr", -1);
checkHome(12, 0, "Dhuhr", "Asr", 1);
checkHome(15, 20, "Asr", "Maghrib", 2);
checkHome(17, 47, "Maghrib", "Isha", 3);
checkHome(20, 0, "Isha", "Fajr", 4);
console.log("PASS: Home timeline includes Fajr → Sunrise → Dhuhr → Asr → Maghrib → Isha.");

// Exercise the same helper used by the live Prayer iframe.
const timelineStart = prayer.indexOf("function mominTimelineStateAt(seconds){");
const timelineEnd = prayer.indexOf("\nfunction tick(){", timelineStart);
assert.ok(timelineStart >= 0 && timelineEnd > timelineStart, "Prayer iframe timeline helper must exist.");
const P = names.map((name) => {
  const match = timings[name].match(/(\d{1,2}):(\d{2})/);
  let hour = Number(match[1]);
  const suffix = timings[name].match(/\b(AM|PM)\b/i);
  if (suffix) hour = hour % 12 + (suffix[1].toUpperCase() === "PM" ? 12 : 0);
  return { n: name, m: hour * 60 + Number(match[2]) };
});
const prayerContext = vm.createContext({ P, sunriseM: 6 * 60 + 12, Math });
vm.runInContext(prayer.slice(timelineStart, timelineEnd) + "\nglobalThis.getPrayerTimeline = mominTimelineStateAt;", prayerContext);

function checkPrayerPage(hour, minute, current, next, prayerIndex) {
  const state = prayerContext.getPrayerTimeline(hour * 3600 + minute * 60);
  assert.equal(state.currentName, current, "Prayer page current event at " + hour + ":" + minute);
  assert.equal(state.nextName, next, "Prayer page next event at " + hour + ":" + minute);
  if (prayerIndex !== undefined) assert.equal(state.currentPrayerIndex, prayerIndex);
}
checkPrayerPage(4, 0, "Isha", "Fajr", 4);
checkPrayerPage(5, 30, "Fajr", "Sunrise", 0);
checkPrayerPage(6, 12, "Sunrise", "Dhuhr", -1);
checkPrayerPage(10, 55, "Sunrise", "Dhuhr", -1);
checkPrayerPage(12, 0, "Dhuhr", "Asr", 1);
checkPrayerPage(15, 20, "Asr", "Maghrib", 2);
checkPrayerPage(17, 47, "Maghrib", "Isha", 3);
checkPrayerPage(20, 0, "Isha", "Fajr", 4);
console.log("PASS: Prayer page uses the same location-time event sequence.");

// Sunrise is informational only; the completion tracker remains five salah.
assert.match(home, /function prayerNames\(\)\{return \['Fajr','Dhuhr','Asr','Maghrib','Isha'\];\}/);
assert.match(home, /function doneCount\(\)\{var done=doneMap\(\);return prayerNames\(\)\.filter/);
const homeSunrise = home.slice(home.indexOf("var sunrise=parsePrayerDate(timings.Sunrise,0);", home.indexOf("function trackerMarkup")), home.indexOf("return rows.join", home.indexOf("function trackerMarkup")));
assert.ok(homeSunrise.includes("Sunrise"));
assert.doesNotMatch(homeSunrise, /<button|role="checkbox"|togglePrayer/);
const prayerSunrise = prayer.slice(prayer.indexOf("if(sunriseM!==null){", prayer.indexOf("function rows(anim)")), prayer.indexOf('$("rows").innerHTML', prayer.indexOf("function rows(anim)")));
assert.ok(prayerSunrise.includes('aria-label="Sunrise time, informational only"'));
assert.doesNotMatch(prayerSunrise, /<button|role="checkbox"|class="ck"|data-i=/);
assert.match(prayer, /"of 5"/);
console.log("PASS: Sunrise never becomes a sixth salah or completion checkbox.");

// Both views continue to consume timings from the existing location-aware prayer data bridge.
assert.match(bridge, /timings: data \? data\.timings : null/);
assert.match(prayer, /mominMinutes\(timings\.Sunrise\)/);
assert.match(index, /momin-home-design-v2\.js\?v=20261105-sunrise-prayer-sequence-v1/);
assert.match(index, /momin-prayer-page-v1\.js\?v=20261105-sunrise-prayer-sequence-v1/);
assert.match(bridge, /prayers-page-v1\.html\?embed=1&amp;v=20261105-sunrise-prayer-sequence-v1/);
console.log("MOMIN Prayer Sunrise sequence QA passed.");
