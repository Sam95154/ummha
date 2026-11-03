import assert from "node:assert/strict";
import { prayerTimeToEpoch } from "../src/native/momin-prayer-time-utils.js";

function localClock(epoch, zone) {
  const parts = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(epoch)).forEach((part) => { parts[part.type] = part.value; });
  return {
    date: parts.year + "-" + parts.month + "-" + parts.day,
    time: parts.hour + ":" + parts.minute
  };
}

const cases = [
  { date: "2026-11-03", time: "19:00", zone: "Asia/Kolkata", expected: Date.UTC(2026, 10, 3, 13, 30) },
  { date: "2026-11-03", time: "05:17 (IST)", zone: "Asia/Kolkata", expected: Date.UTC(2026, 10, 2, 23, 47) },
  { date: "2026-11-03", time: "19:00", zone: "America/New_York", expected: Date.UTC(2026, 10, 4, 0, 0) },
  { date: "2026-07-03", time: "19:00", zone: "America/New_York", expected: Date.UTC(2026, 6, 3, 23, 0) },
  { date: "2026-11-03", time: "19:00", zone: "Asia/Kathmandu", expected: Date.UTC(2026, 10, 3, 13, 15) },
  { date: "2026-11-03", time: "00:15", zone: "Pacific/Auckland", expected: Date.UTC(2026, 10, 2, 11, 15) },
  { date: "2026-03-29", time: "08:05", zone: "Europe/London", expected: Date.UTC(2026, 2, 29, 7, 5) }
];

for (const testCase of cases) {
  const actual = prayerTimeToEpoch(testCase.date, testCase.time, testCase.zone);
  assert.equal(actual, testCase.expected,
    testCase.date + " " + testCase.time + " " + testCase.zone + " must map to the exact epoch");
  assert.deepEqual(localClock(actual, testCase.zone),
    { date: testCase.date, time: testCase.time.match(/(\d{1,2}:\d{2})/)[1] },
    "Scheduled alarm must ring at the requested local wall-clock time");
}

assert.equal(prayerTimeToEpoch("2026-03-08", "02:30", "America/New_York"), null,
  "A nonexistent local time during DST spring-forward must not silently shift.");
assert.equal(prayerTimeToEpoch("not-a-date", "19:00", "Asia/Kolkata"), null);
assert.equal(prayerTimeToEpoch("2026-11-03", "25:00", "Asia/Kolkata"), null);
assert.equal(prayerTimeToEpoch("2026-11-03", "19:00", "Not/A_Timezone"), null);

console.log("PASS: prayer alarm conversion is exact in positive, negative, fractional, and daylight-saving time zones.");
