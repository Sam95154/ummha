import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const native = read("src/native/momin-native-prayer-alarm.js");
const bridge = read("momin-notifications-admin-inbox-v1.js");
const settings = read("momin-settings-design-v2.js");
const notifications = read("notifications.html");
const auth = read("momin-auth-v1.js");
const migration = read("supabase/migrations/20261103150000_momin_admin_notifications_default_on.sql");
const receiver = read("src/native/android/MominPrayerAlarmReceiver.java");
const playback = read("src/native/android/MominAzanPlaybackService.java");

new vm.Script(bridge, { filename: "momin-notifications-admin-inbox-v1.js" });
new vm.Script(auth, { filename: "momin-auth-v1.js" });

const prayerStart = native.indexOf('kind:"prayer"');
const prayerEnd = native.indexOf('      });', prayerStart);
assert.ok(prayerStart >= 0 && prayerEnd > prayerStart, "Prayer alarm record must exist.");
const prayerRecord = native.slice(prayerStart, prayerEnd);
assert.match(prayerRecord, /playAzan:true/, "Every selected prayer-time alarm must start Azan.");
assert.match(prayerRecord, /at,prayer:name,kind:"prayer"/, "Azan alarm must be scheduled at the actual prayer timestamp.");

const reminderStart = native.indexOf('kind:"reminder"');
const reminderEnd = native.indexOf('        });', reminderStart);
assert.ok(reminderStart >= 0 && reminderEnd > reminderStart, "Advance reminder record must exist.");
assert.match(native.slice(reminderStart, reminderEnd), /playAzan:false/, "Advance reminders must never start Azan.");

const nativeSchedule = native.slice(native.indexOf("async function buildAlarms"), native.indexOf("async function scheduleFromPreferences"));
assert.match(nativeSchedule, /if\(!prefs\.prayers\[index\]\) return;/, "Disabled prayer toggles must not schedule alarms.");
assert.match(nativeSchedule, /reminderAt>now\+5000/, "Advance reminders must be scheduled before actual prayer time.");

assert.match(bridge, /announcements:get\("momin-announcements-enabled","true"\)!=="false"/, "Bridge defaults Admin announcements on.");
assert.match(bridge, /syncAnnouncementPreference\(prefs\)/, "Announcement consent must be written to the signed-in profile.");
const bridgeSaveStart = bridge.indexOf("savePrefs:function(prefs){");
const bridgeSaveEnd = bridge.indexOf("return saved;", bridgeSaveStart);
assert.ok(bridgeSaveStart >= 0 && bridgeSaveEnd > bridgeSaveStart, "Notification settings save bridge must exist.");
assert.match(bridge.slice(bridgeSaveStart, bridgeSaveEnd), /syncPushPreferences\(\)/, "Native and web save paths must sync Admin announcement consent.");
assert.match(bridge, /playAzan\(\);/, "Foreground prayer-time fallback must always play Azan.");
assert.doesNotMatch(bridge.slice(bridge.indexOf("var prayerElapsed="), bridge.indexOf("function currentRoute")), /sound===\s*["']chime["']/, "Actual prayer Azan must not depend on the advance reminder tone.");

assert.match(settings, /admin:get\("momin-announcements-enabled","true"\)!=="false"/, "Settings draft defaults Admin announcements on.");
assert.match(settings, /full Makkah Azan plays at the actual time for every enabled prayer/i, "Settings must describe actual prayer-time Azan.");
assert.match(settings, /Advance reminder notification sound/, "Sound setting must be clearly labelled as an advance reminder sound.");

assert.match(notifications, /announcements:1/, "Notifications page starts new/unset announcement preference on.");
assert.match(notifications, /momin-announcements-enabled","true"/, "Notifications page fallback defaults announcement preference on.");
assert.match(notifications, /setItem\("momin-announcements-enabled",prefs\.announcements\?"true":"false"\)/, "Standalone Notifications page saves announcement preference.");

assert.match(auth, /select\("announcements_enabled"\)/, "Auth loads the stored account announcement choice.");
assert.match(auth, /localStorage\.setItem\("momin-announcements-enabled"/, "Auth applies the stored account choice to this device.");

assert.match(migration, /alter table public\.momin_profiles alter column announcements_enabled set default true/i);
assert.match(migration, /alter table public\.momin_fcm_tokens alter column announcements_enabled set default true/i);
assert.doesNotMatch(migration, /update public\.momin_(profiles|fcm_tokens)/i, "Migration must not override existing user choices.");

assert.match(receiver, /MominAzanPlaybackService\.start\(context/, "Android receiver starts the Azan service.");
assert.match(playback, /R\.raw\.makkah_azan_notification/, "Android playback uses the bundled Makkah Azan audio.");
assert.match(playback, /Stop Azan/, "Android playback exposes a user stop action.");

console.log("MOMIN Azan timing and Admin notification default QA passed.");
console.log("- Every enabled salah gets an actual-time Azan alarm.");
console.log("- Advance reminders stay separate and never start Azan.");
console.log("- User-disabled individual prayers remain unscheduled.");
console.log("- Admin announcements default on for new/unset preferences.");
console.log("- Stored account opt-outs are restored and preserved across devices.");
console.log("- Settings save synchronizes the account preference, including Android.");
console.log("- Android receiver and bundled playback path are present.");
