import { Capacitor, registerPlugin } from "@capacitor/core";

const NativePrayer = registerPlugin("MominPrayerAlarm");
const isNative = Capacitor.isNativePlatform();
let lastSignature = "";
let lastScheduledAt = 0;
let schedulePromise = null;

function read(key, fallback = "") {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value; }
  catch (_) { return fallback; }
}
function readOn(key, fallback = true) {
  return read(key, fallback ? "true" : "false") !== "false";
}
function getLocation() {
  let cache = null;
  try { cache = JSON.parse(read("noor-prayer-cache", "null") || "null"); } catch (_) {}
  const api = window.API_STORE || {};
  const live = window.livePrayer || {};
  const meta = live.meta || (cache && cache.data && cache.data.meta) || {};
  const latText = read("noor-latitude", api.latitude == null ? "" : String(api.latitude));
  const lonText = read("noor-longitude", api.longitude == null ? "" : String(api.longitude));
  const lat = latText === "" ? null : Number(latText);
  const lon = lonText === "" ? null : Number(lonText);
  const coords = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180;
  return {
    latitude: coords ? lat : null,
    longitude: coords ? lon : null,
    city: String(read("noor-city", api.city || "")).trim(),
    country: String(read("noor-country", api.country || "")).trim(),
    method: Math.max(0, Math.min(25, Number(read("noor-method", api.method || "3")) || 3)),
    school: read("noor-asr-method", "standard") === "hanafi" ? 1 : 0,
    timezone: String(meta.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata")
  };
}
function zonedParts(epoch, zone) {
  const parts = {};
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(epoch)).forEach(x => { parts[x.type] = x.value; });
  return parts;
}
function dateInZone(zone) {
  const p = zonedParts(Date.now(), zone);
  return p.year + "-" + p.month + "-" + p.day;
}
function addDays(iso, days) {
  const [y,m,d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return [date.getUTCFullYear(), String(date.getUTCMonth()+1).padStart(2,"0"), String(date.getUTCDate()).padStart(2,"0")].join("-");
}
function timeAt(iso, clock, zone) {
  const match = String(clock || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [y,m,d] = iso.split("-").map(Number);
  const h = Number(match[1]), minute = Number(match[2]);
  let epoch = Date.UTC(y,m-1,d,h,minute,0);
  for (let n=0; n<4; n++) {
    const p = zonedParts(epoch,zone);
    const represented = Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),0);
    const delta = represented - epoch;
    if (!delta) break;
    epoch -= delta;
  }
  return epoch;
}
function rowDate(row) {
  const iso = row && row.date && row.date.gregorian && row.date.gregorian.iso;
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0,10);
  const raw = row && row.date && row.date.gregorian && row.date.gregorian.date;
  const m = String(raw || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? m[3]+"-"+m[2]+"-"+m[1] : "";
}
function calendarUrl(month,year,loc) {
  const params = new URLSearchParams({method:String(loc.method),school:String(loc.school)});
  let path;
  if (loc.latitude != null && loc.longitude != null) {
    path = "calendar/"+year+"/"+month;
    params.set("latitude",String(loc.latitude));
    params.set("longitude",String(loc.longitude));
  } else {
    if (!loc.city || !loc.country) throw new Error("Set your location in Prayer Times before enabling prayer alarms.");
    path = "calendarByCity/"+year+"/"+month;
    params.set("city",loc.city);
    params.set("country",loc.country);
  }
  return "https://api.aladhan.com/v1/"+path+"?"+params.toString();
}
function prefsFrom(input) {
  const p = input || {};
  const on = p.on === undefined ? readOn("noor-notifications",true) : !!p.on;
  const names = ["fajr","dhuhr","asr","maghrib","isha"];
  return {
    on,
    prayers: Array.isArray(p.pr) ? names.map((_,i)=>!!p.pr[i]) : names.map(n=>readOn("noor-notify-"+n,on)),
    lead: Math.max(0,Math.min(60,Number(p.lead === undefined ? read("noor-prayer-reminder-minutes","0") : p.lead)||0)),
    sound: String(read("noor-adhan-sound","azan")||"azan").toLowerCase(),
    dates: readOn("noor-islamic-event-reminders", false)
  };
}
async function buildAlarms(prefs,loc) {
  const first = dateInZone(loc.timezone);
  const dates = Array.from({length:30},(_,i)=>addDays(first,i));
  const months = [...new Set(dates.map(d=>d.slice(0,7)))];
  const rows = new Map();
  for (const monthKey of months) {
    const [year,month] = monthKey.split("-").map(Number);
    const res = await fetch(calendarUrl(month,year,loc),{headers:{Accept:"application/json"}});
    if (!res.ok) throw new Error("Prayer calendar returned HTTP "+res.status+".");
    const payload = await res.json();
    if (!payload || !Array.isArray(payload.data)) throw new Error("Prayer calendar did not return daily timings.");
    const timezoneRow = payload.data.find(row => row && row.meta && row.meta.timezone);
    const returnedTimezone = (payload.meta && payload.meta.timezone) || (timezoneRow && timezoneRow.meta.timezone);
    if (returnedTimezone) loc.timezone = String(returnedTimezone);
    payload.data.forEach(row=>{const key=rowDate(row);if(key)rows.set(key,row);});
  }
  const names=["Fajr","Dhuhr","Asr","Maghrib","Isha"], alarms=[], now=Date.now();
  dates.forEach(iso=>{
    const row=rows.get(iso);
    if (!row || !row.timings) return;
    names.forEach((name,index)=>{
      if (!prefs.prayers[index]) return;
      const at=timeAt(iso,row.timings[name],loc.timezone);
      if (!Number.isFinite(at) || at<=now+5000) return;
      if (prefs.lead>0) {
        const reminderAt=at-prefs.lead*60000;
        if (reminderAt>now+5000) alarms.push({
          id:iso+"-"+name.toLowerCase()+"-reminder",at:reminderAt,prayer:name,kind:"reminder",
          title:"MOMIN · "+name+" reminder",body:name+" is coming up in "+prefs.lead+" minutes.",
          playAzan:false,sound:prefs.sound
        });
      }
      alarms.push({
        id:iso+"-"+name.toLowerCase()+"-prayer",at,prayer:name,kind:"prayer",
        title:"MOMIN · "+name+" time",body:"It is time for "+name+".",
        playAzan:true,sound:prefs.sound
      });
    });
    if (prefs.dates) {
      const hijri = row.date && row.date.hijri;
      const hijriDay = Number(hijri && hijri.day);
      const hijriMonth = Number(hijri && hijri.month && hijri.month.number);
      const hijriYear = String(hijri && hijri.year || "");
      const occasions = {
        "1-1":"Islamic New Year",
        "1-10":"Day of Ashura",
        "9-1":"Ramadan begins",
        "10-1":"Eid al-Fitr",
        "12-9":"Day of Arafah",
        "12-10":"Eid al-Adha"
      };
      const occasion = occasions[hijriMonth + "-" + hijriDay];
      if (occasion) {
        const festivalAt = timeAt(iso, "07:00", loc.timezone);
        if (Number.isFinite(festivalAt) && festivalAt > now + 5000) {
          const safeName = occasion.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          alarms.push({
            id: iso + "-festival-" + safeName,
            at: festivalAt,
            prayer: "",
            kind: "festival",
            title: "MOMIN · " + occasion,
            body: occasion + " — Islamic dates may vary by local moon sighting.",
            playAzan: false,
            sound: "system"
          });
        }
      }
    }
  });
  return alarms.sort((a,b)=>a.at-b.at);
}
async function scheduleFromPreferences(input,force=false) {
  if (!isNative) return {native:false,scheduled:0};
  const prefs=prefsFrom(input);
  if (!prefs.on || (!prefs.prayers.some(Boolean) && !prefs.dates)) {
    await NativePrayer.cancel();
    lastSignature="";
    return {native:true,scheduled:0,paused:true};
  }
  const loc=getLocation();
  if (loc.latitude==null && (!loc.city || !loc.country)) {
    throw new Error("Set your location in Prayer Times before enabling prayer alarms.");
  }
  const signature=JSON.stringify({prefs,loc,date:dateInZone(loc.timezone)});
  if (!force && signature===lastSignature && Date.now()-lastScheduledAt<6*60*60*1000) return {native:true,unchanged:true};
  if (schedulePromise) return schedulePromise;
  schedulePromise=(async()=>{
    const alarms=await buildAlarms(prefs,loc);
    const result=await NativePrayer.schedule({alarms});
    lastSignature=signature;
    lastScheduledAt=Date.now();
    return {native:true,scheduled:alarms.length,result};
  })();
  try{return await schedulePromise;}finally{schedulePromise=null;}
}

if (isNative) {
  window.MominNativePrayerAlarm={
    isNative:true,
    getStatus:()=>NativePrayer.getStatus(),
    requestLocationPermission:()=>NativePrayer.requestLocationPermission(),
    requestNotificationPermission:()=>NativePrayer.requestNotificationPermission(),
    openExactAlarmSettings:()=>NativePrayer.openExactAlarmSettings(),
    schedule:alarms=>NativePrayer.schedule({alarms}),
    scheduleFromPreferences,
    cancel:async()=>{lastSignature="";lastScheduledAt=0;return NativePrayer.cancel();},
    testNotification:()=>NativePrayer.testNotification(),
    previewAzan:()=>NativePrayer.previewAzan(),
    stopAzan:()=>NativePrayer.stopAzan()
  };
  const refresh=()=>scheduleFromPreferences().catch(error=>console.warn("MOMIN native prayer alarm:",error));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh();});
  window.addEventListener("focus",refresh);
  window.addEventListener("load",()=>window.setTimeout(refresh,1800),{once:true});
}
