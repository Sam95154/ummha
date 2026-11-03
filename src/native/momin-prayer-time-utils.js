// Convert a prayer time returned as a local wall-clock value into an absolute epoch.
// This avoids applying the zone offset repeatedly, which can move alarms by hours.
function zonedParts(epoch, zone) {
  const parts = {};
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(epoch)).forEach((part) => { parts[part.type] = part.value; });
  return parts;
}

export function prayerTimeToEpoch(isoDate, clock, timeZone) {
  const dateMatch = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(clock || "").match(/(\d{1,2}):(\d{2})/);
  if (!dateMatch || !timeMatch || !timeZone) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const checkDate = new Date(Date.UTC(year, month - 1, day));
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() + 1 !== month ||
      checkDate.getUTCDate() !== day || hour > 23 || minute > 59) return null;

  // Use the requested wall-clock fields as a UTC-shaped reference. On each
  // pass, compare the formatted candidate to that same reference. Comparing
  // against the candidate epoch itself repeatedly subtracts the zone offset.
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let epoch = desired;
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const local = zonedParts(epoch, timeZone);
      const represented = Date.UTC(
        Number(local.year), Number(local.month) - 1, Number(local.day),
        Number(local.hour), Number(local.minute), 0
      );
      const delta = represented - desired;
      if (delta === 0) return epoch;
      epoch -= delta;
    }

    // A nonexistent wall-clock value during a DST spring-forward gap must
    // not be scheduled at a different local time.
    const finalLocal = zonedParts(epoch, timeZone);
    const finalValue = Date.UTC(
      Number(finalLocal.year), Number(finalLocal.month) - 1, Number(finalLocal.day),
      Number(finalLocal.hour), Number(finalLocal.minute), 0
    );
    return finalValue === desired ? epoch : null;
  } catch (_) {
    return null;
  }
}
