// Future-only helpers for the calendar popup cards.
//
// Availability and bookings are present/future events, so any date/time the
// teacher picks — or reschedules/changes a future card to — must be in the
// future relative to the user's current LOCAL time. These small pure helpers
// give the cards a single, consistent source of truth:
//   • pastDaysMatcher()    → react-day-picker `disabled` matcher hiding past days
//   • timeFloorForDate()   → the TimeSelect/TimeRangeFields `minTime` floor
//                            (current HH:MM when the date is today, else none)
//   • isFutureDateTime()   → submit-time guard for the combined date + time

const pad2 = (n) => String(n).padStart(2, '0');

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isTodayLocal(date) {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// react-day-picker matcher that disables every day before today (today + future
// stay selectable). Pass to a shadcn <Calendar disabled={pastDaysMatcher()} />.
export function pastDaysMatcher() {
  return { before: startOfToday() };
}

// Lower bound ('HH:MM') for a time picker on the given date: the current
// wall-clock time when the date is today (so only LATER times show), or '' (no
// floor) for a future date. Fed to TimeSelect/TimeRangeFields `minTime`, which
// filters strictly (options must be > minTime).
export function timeFloorForDate(date) {
  if (!isTodayLocal(date)) return '';
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

// True when (date + 'HH:MM') is strictly in the future. Used as the final
// submit-time guard so a change/reschedule can never land in the past.
export function isFutureDateTime(date, hhmm) {
  if (!date || !hhmm) return false;
  const [h, m] = String(hhmm).split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const dt = date instanceof Date ? new Date(date) : new Date(date);
  if (Number.isNaN(dt.getTime())) return false;
  dt.setHours(h, m, 0, 0);
  return dt.getTime() > Date.now();
}
