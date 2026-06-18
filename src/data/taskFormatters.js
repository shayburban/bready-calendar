// Shared formatters + classifiers for the Teacher Task Manager. ONE place so the
// page and the calendar-sidebar twin format dates/money/duration identically and
// classify To Do / Done by the same rules (they consume the same hook).
//
// Display zone: teacher profile tz when known, else the browser default (Spec M6).
// Time math is on absolute UTC instants; we only format to a zone at render.

// Build 'DD.MM.YYYY' in the given IANA tz (or browser default) via Intl parts.
export function formatDateDDMMYYYY(iso, tz) {
  if (!iso) return '—';
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz || undefined,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(new Date(iso));
    const get = (t) => parts.find((p) => p.type === t)?.value || '';
    return `${get('day')}.${get('month')}.${get('year')}`;
  } catch {
    return '—';
  }
}

// 'HH:MM' (24h) in the given zone.
function hhmm(iso, tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz || undefined,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${get('hour')}:${get('minute')}`;
}

// 'HH:MM – HH:MM' (en-dash standardized, Spec F).
export function formatTimeRange(startIso, endIso, tz) {
  if (!startIso) return '—';
  try {
    const start = hhmm(startIso, tz);
    const end = endIso ? hhmm(endIso, tz) : '';
    return end ? `${start} – ${end}` : start;
  } catch {
    return '—';
  }
}

// Hours between two ISO instants (time math only — NOT money). null-safe.
export function hoursBetween(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round((ms / (60 * 60 * 1000)) * 100) / 100;
}

// Money + duration display (match the existing '10 $' / '3 Hours' style). Never
// invents a value: unknown -> '—'.
export function formatMoney(n) {
  return n == null || !Number.isFinite(Number(n)) ? '—' : `${Number(n)} $`;
}
export function formatDuration(hours) {
  if (hours == null || !Number.isFinite(Number(hours))) return '—';
  const h = Number(hours);
  return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
}

// To Do / Done — deterministic precedence (Spec F). Classify by FIRST match:
//   1) cancelled                 -> Done
//   2) completed                 -> Done
//   3) reschedule-pending        -> To Do
//   4) confirmed & not yet ended -> To Do
//   5) pending                   -> To Do
//   fallback: ended -> Done, else To Do
export function classifyTodoDone(record, nowMs = Date.now()) {
  if (!record) return 'todo';
  const ended = record.endUTC ? new Date(record.endUTC).getTime() < nowMs : false;
  if (record.type === 'cancelled') return 'done';
  if (record.type === 'completed') return 'done';
  if (record.isReschedule || record.requestKind === 'reschedule') return 'todo';
  if (record.type === 'booked' && !ended) return 'todo';
  if (record.type === 'waiting' || record.status === 'pending') return 'todo';
  return ended ? 'done' : 'todo';
}
