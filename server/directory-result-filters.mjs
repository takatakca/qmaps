// Mirrors the four service booleans from src/lib/searchFilters.ts. Choice
// group labels cannot match these keys because they contain "::".
export const services = [
  "Offers Delivery", "Offers Takeout", "Takes Reservations", "Wheelchair Accessible",
];
const normalize = value =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const entries = value => record(value)
  ? Object.entries(value).filter(([key]) => key !== "__proto__") : [];

export function matchesDirectoryServices(row, required) {
  const attrs = row.attributes;
  const booleans = entries(attrs?.boolean).filter(([, value]) => typeof value === "boolean");
  const hasStructured = booleans.length > 0 ||
    entries(attrs?.single).some(([, value]) => typeof value === "string" && value.length > 0) ||
    entries(attrs?.multi).some(([, value]) => Array.isArray(value) &&
      value.some(item => typeof item === "string"));
  const keys = hasStructured
    ? booleans.filter(([, value]) => value).map(([key]) => key)
    : (row.amenities ?? []).filter(value => typeof value === "string" && !value.includes("::"));
  const normalized = new Set(keys.map(normalize));
  return required.every(key => normalized.has(normalize(key)));
}

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dateKey = /^\d{4}-\d{2}-\d{2}$/;
const clock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto", calendar: "iso8601", numberingSystem: "latn",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
export function quebecSearchTime(now = new Date()) {
  const { year, month, day, hour, minute } = Object.fromEntries(clock.formatToParts(now)
    .map(({ type, value }) => [type, value]));
  const today = `${year}-${month}-${day}`;
  // Work in the civil calendar here, so subtracting a day remains correct
  // across the Toronto time zone's 23-hour and 25-hour DST days.
  const civil = new Date(today + "T00:00:00Z");
  const weekday = days[civil.getUTCDay()];
  civil.setUTCDate(civil.getUTCDate() - 1);
  return { today, weekday, yesterday: civil.toISOString().slice(0, 10),
    previousWeekday: days[civil.getUTCDay()], minuteOfDay: Number(hour) * 60 + Number(minute) };
}

const hhmm = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const minutes = value => typeof value === "string" && hhmm.test(value)
  ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
function openBlock(day, now, carryOver) {
  return record(day) && !day.closed && Array.isArray(day.blocks) && day.blocks.some(block => {
    if (!record(block)) return false;
    const open = minutes(block.open), close = minutes(block.close);
    if (!Number.isFinite(open) || !Number.isFinite(close) || open === close) return false;
    return carryOver ? close < open && now < close : now >= open && (close < open || now < close);
  });
}

// Mirrors businessHours.ts and isBusinessOpenNow, evaluated at a single
// Québec civil minute for each request rather than the browser's timezone.
export function matchesDirectoryOpen(row, time) {
  if (row.status !== "open") return false;
  const week = row.hours_json, special = row.special_hours;
  const recognizedWeek = record(week) && days.some(key => key in week);
  const recognizedSpecial = record(special) &&
    Object.entries(special).some(([date, value]) => dateKey.test(date) && record(value));
  if (!recognizedWeek && !recognizedSpecial)
    return row.is_open === true && !/fermé|closed/i.test(row.hours ?? "");
  const todayOverride = recognizedSpecial && record(special[time.today]);
  if (openBlock(todayOverride ? special[time.today] : week?.[time.weekday], time.minuteOfDay, false))
    return true;
  if (todayOverride) return false;
  const previousOverride = recognizedSpecial && record(special[time.yesterday]);
  return openBlock(previousOverride ? special[time.yesterday] : week?.[time.previousWeekday],
    time.minuteOfDay, true);
}
