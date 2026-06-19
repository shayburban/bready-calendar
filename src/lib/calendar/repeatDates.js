// Repeat-occurrence expansion for the "Add New Booking Or Availability" popup.
//
// Given a Start Date, a set of active weekdays, and a "Repeat For: N weeks"
// count, produce the list of YYYY-MM-DD dates the availability/booking applies
// to. This is the popup's equivalent of the sidebar's date-range + weekday
// pipeline, but anchored to a single start date + a week count (the popup's
// "Repeat" control). Pure + side-effect free so it can be unit-tested and reused
// by both the availability tab (one slot per date) and the booking tab (one
// request per date).

export function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// weekdays: array/Set of JS getDay() indices (0=Sun … 6=Sat).
// repeatWeeks: integer ≥ 1 to repeat; 0/undefined/null → no repeat (single date).
// Returns a sorted, de-duped array of YYYY-MM-DD strings. The chosen start date
// is ALWAYS included even if its own weekday isn't toggled.
export function expandRepeatDates({ startDate, weekdays, repeatWeeks }) {
  if (!startDate) return [];
  const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];
  start.setHours(0, 0, 0, 0);
  const startKey = toYMD(start);

  const wk = Array.isArray(weekdays) ? weekdays : Array.from(weekdays || []);
  const weeks = Number(repeatWeeks);

  // No repeat (or no active weekday) → just the single date.
  if (!Number.isFinite(weeks) || weeks < 1 || wk.length === 0) return [startKey];

  const totalDays = Math.min(weeks, 104) * 7; // hard cap (2 years) so it's finite
  const dates = new Set([startKey]); // start date is always included
  const cur = new Date(start);
  for (let i = 0; i < totalDays; i++) {
    if (wk.includes(cur.getDay())) dates.add(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return Array.from(dates).sort();
}
