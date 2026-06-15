// TimeKit — the single time-arithmetic substrate (spec §1.2).
//
// EVERY time comparison, validation, and persisted bookability value in the
// scheduling system routes through this module. NO ad-hoc time math anywhere
// else (enforced by the T1 ESLint rule). A timezone (IANA id) may enter
// rendering and recurrence materialization, but NEVER a comparison, a
// validation, or a persisted value (R24, Constraint 5).
//
// Canonical type: UtcInstant = epoch milliseconds (number). This is the
// comparison/persistence form. Timezone-aware values exist only transiently
// inside this module (via luxon) and in DISPLAY outputs (toViewer).
//
// This module is the ONLY place allowed to call Date.now() / new Date() —
// it is the sole clock + the sole bridge to wall-clock math.

import { DateTime } from 'luxon';
import { RRule, rrulestr } from 'rrule';

export const GRID_MS = 15 * 60 * 1000; // 15-minute grid, anchored at epoch (== top of each UTC hour)
export const HOLD_TTL_MIN_DEFAULT = 10; // platform config default (§1.1)

const EXACT_FACTOR = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
};

const CALENDAR_UNIT = new Set(['day', 'week', 'month']);

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

// now(): the SOLE time authority. In this frontend prototype it is the local
// machine clock surfaced as a UTC instant; when the backend lands, server time
// replaces this body and nothing else changes.
export const now = () => Date.now();

// ---------------------------------------------------------------------------
// Arithmetic — the two-kind split (R24)
// ---------------------------------------------------------------------------

// addExact: PHYSICAL durations on absolute instants (lesson length, hour-unit
// L, B, HOLD_TTL). 2 hours is ALWAYS 7,200,000 ms, even across a DST shift.
export const addExact = (instant, n, unit) => {
  const factor = EXACT_FACTOR[unit];
  if (factor === undefined) {
    throw new Error(`addExact: unit must be second|minute|hour, got "${unit}"`);
  }
  return instant + n * factor;
};

// addCalendar: CALENDAR concepts (W, and L when its unit is days). anchorTz is
// REQUIRED — omitting it is a programming error (also caught by lint). Luxon
// clamps month-ends (Jan 31 + 1 month -> Feb 28/29) and keeps wall-clock across
// DST (adding 1 day == same local time next day, which may be 23 or 25 real h).
export const addCalendar = (instant, n, unit, anchorTz) => {
  if (!CALENDAR_UNIT.has(unit)) {
    throw new Error(`addCalendar: unit must be day|week|month, got "${unit}"`);
  }
  if (!anchorTz || typeof anchorTz !== 'string') {
    throw new Error('addCalendar: anchorTz (IANA id) is required');
  }
  const dt = DateTime.fromMillis(instant, { zone: anchorTz });
  if (!dt.isValid) {
    throw new Error(`addCalendar: invalid anchorTz "${anchorTz}" (${dt.invalidReason})`);
  }
  return dt.plus({ [unit]: n }).toMillis();
};

// ---------------------------------------------------------------------------
// Settings normalization helpers (used by corridor; mirrors normalize.js units)
// ---------------------------------------------------------------------------

// Apply a {value, unit} duration to an instant, choosing exact vs calendar math
// per the unit. Hours -> addExact; days/weeks/months -> addCalendar(anchorTz).
// Returns the instant unchanged when the pair is null ("not configured").
const applyDuration = (instant, value, unit, anchorTz) => {
  if (value == null || unit == null) return instant;
  switch (unit) {
    case 'second':
    case 'minute':
    case 'hour':
      return addExact(instant, value, unit);
    case 'day':
    case 'week':
    case 'month':
      return addCalendar(instant, value, unit, anchorTz);
    default:
      throw new Error(`applyDuration: unknown unit "${unit}"`);
  }
};

// ---------------------------------------------------------------------------
// Corridor (R4 / R5)
// ---------------------------------------------------------------------------

// corridor(teacher, mode): the rolling [nearEdge, farEdge] window the lesson
// START must lie inside. Inclusive edges; the end may pass farEdge.
//   mode 'instant'    -> nearEdge = now + L + HOLD_TTL   (public display + Checkpoint H)
//   mode 'reschedule' -> nearEdge = now + L              (student-initiated reschedule)
//   farEdge = now + W (calendar math, teacher tz) in both modes.
// teacher = { availabilityWindow:{value,unit}, minNotice:{value,unit},
//             teacherTz, holdTtlMin }. Null pairs => that edge is unbounded.
export const corridor = (teacher, mode, atInstant = now()) => {
  const {
    availabilityWindow = {},
    minNotice = {},
    teacherTz,
    holdTtlMin = HOLD_TTL_MIN_DEFAULT,
  } = teacher || {};

  // nearEdge: minimum notice from now.
  let nearEdge = applyDuration(atInstant, minNotice.value, minNotice.unit, teacherTz);
  if (mode === 'instant') {
    // HOLD_TTL is ADDITIONAL to L so confirming inside notice is impossible (R5).
    nearEdge = addExact(nearEdge, holdTtlMin, 'minute');
  } else if (mode !== 'reschedule') {
    throw new Error(`corridor: mode must be 'instant' | 'reschedule', got "${mode}"`);
  }

  // farEdge: availability window from now (null window => unbounded).
  const farEdge =
    availabilityWindow.value == null || availabilityWindow.unit == null
      ? Number.POSITIVE_INFINITY
      : applyDuration(atInstant, availabilityWindow.value, availabilityWindow.unit, teacherTz);

  return { nearEdge, farEdge };
};

// ---------------------------------------------------------------------------
// Grid (R1 / R3)
// ---------------------------------------------------------------------------

// snapUp: the smallest quarter-hour boundary >= instant. Because the grid is
// anchored at epoch (== every UTC hour top) and all real IANA offsets are
// multiples of 15 min, a UTC boundary is also a local quarter-hour everywhere.
export const snapUp = (instant) => Math.ceil(instant / GRID_MS) * GRID_MS;

// snapDown: the largest quarter-hour boundary <= instant.
export const snapDown = (instant) => Math.floor(instant / GRID_MS) * GRID_MS;

export const isOnGrid = (instant) => instant % GRID_MS === 0;

// gridCandidates: every quarter-hour start within [from, to] inclusive.
// Both bounds MUST be finite — a non-finite `to` (e.g. an unbounded farEdge
// when W is null) would loop forever, so callers must cap the window first
// (offer generation caps `to` at the last availability end). Throw loudly
// rather than hang.
export const gridCandidates = (from, to) => {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error('gridCandidates: from/to must be finite instants (cap the window first)');
  }
  const out = [];
  if (to < from) return out;
  for (let t = snapUp(from); t <= to; t += GRID_MS) out.push(t);
  return out;
};

// ---------------------------------------------------------------------------
// Display (R-display) — output must NEVER feed a comparison/validation/persist
// ---------------------------------------------------------------------------

// detectViewerTz: the viewer's IANA zone via Intl. NEVER Geo-IP. null => the
// caller must show the timezone picker (defaulting to the teacher's zone).
export const detectViewerTz = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || null;
  } catch {
    return null;
  }
};

// toViewer: DISPLAY ONLY. Places an instant in a viewer's zone so the UI can
// drop it in the correct day column (a slot may be a different weekday per
// viewer). Returns enough to render without any further math.
export const toViewer = (instant, viewerTz) => {
  const dt = DateTime.fromMillis(instant, { zone: viewerTz });
  if (!dt.isValid) {
    throw new Error(`toViewer: invalid viewerTz "${viewerTz}" (${dt.invalidReason})`);
  }
  return {
    instant,
    zone: viewerTz,
    localDate: dt.toFormat('yyyy-LL-dd'),
    weekday: dt.weekday, // 1=Mon … 7=Sun (luxon)
    hour: dt.hour,
    minute: dt.minute,
    offsetMinutes: dt.offset,
    iso: dt.toISO(),
  };
};

// ---------------------------------------------------------------------------
// Recurrence materialization (R25)
// ---------------------------------------------------------------------------
//
// DST resolution conventions (documented + pinned by T-D):
//   - Nonexistent local time (spring-forward gap): luxon advances into the gap
//     by the gap length, yielding the first valid instant after the wall time.
//   - Ambiguous local time (fall-back overlap): luxon resolves to the EARLIER
//     (pre-transition) offset, i.e. the first of the two occurrences.
// Both produce a single, stable, valid UtcInstant.

const RESOLVE = { year: 'year', month: 'month', day: 'day' };

// materializeOccurrences(recurrence, from, to): expand an AvailabilityRecurrence
// to absolute instants over [from, to]. RRULE chooses WHICH calendar dates;
// luxon turns (anchor_tz, wall-clock, date) into the exact UTC instant — so the
// repeating concept is a LOCAL anchor, never a fixed UTC instant (R25).
//
// recurrence = {
//   anchor_iana_tz, local_wallclock_start: 'HH:MM', duration_minutes,
//   rrule: 'FREQ=WEEKLY;BYDAY=MO', range_start_date: 'YYYY-MM-DD',
//   range_end_date: 'YYYY-MM-DD'|null
// }
export const materializeOccurrences = (recurrence, from, to) => {
  const {
    anchor_iana_tz: tz,
    local_wallclock_start: wall,
    duration_minutes: durMin,
    rrule: rruleStr,
    range_start_date: startDate,
    range_end_date: endDate,
  } = recurrence;

  const [hh, mm] = String(wall).split(':').map((x) => parseInt(x, 10));

  // dtstart for the RRULE: a UTC-naive marker for the local start calendar date.
  // We use rrule purely as a DATE generator; the zone/wall-clock is applied
  // afterwards via luxon, sidestepping rrule's timezone pitfalls.
  const [sy, sm, sd] = startDate.split('-').map((x) => parseInt(x, 10));
  const dtstart = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));

  const opts = RRule.parseString(rruleStr);
  opts.dtstart = dtstart;
  if (endDate) {
    const [ey, em, ed] = endDate.split('-').map((x) => parseInt(x, 10));
    opts.until = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59));
  }
  const rule = new RRule(opts);

  // Widen the date window by a day each side so edge occurrences (whose UTC
  // instant lands inside [from,to] even if their local date sits just outside)
  // are caught; we filter precisely by start_utc afterward.
  const winFrom = new Date(from - 24 * 60 * 60 * 1000);
  const winTo = new Date(to + 24 * 60 * 60 * 1000);
  const dates = rule.between(winFrom, winTo, true);

  const out = [];
  for (const d of dates) {
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth() + 1;
    const da = d.getUTCDate();
    const dt = DateTime.fromObject(
      { year: y, month: mo, day: da, hour: hh, minute: mm },
      { zone: tz }
    );
    if (!dt.isValid) continue; // unresolvable zone — skip defensively
    const startUtc = dt.toMillis();
    const endUtc = addExact(startUtc, durMin, 'minute');
    if (startUtc < from || startUtc > to) continue;
    out.push({
      occurrence_date: dt.toFormat('yyyy-LL-dd'),
      start_utc: startUtc,
      end_utc: endUtc,
    });
  }
  out.sort((a, b) => a.start_utc - b.start_utc);
  return out;
};

// ---------------------------------------------------------------------------
// Grid-regularity invariant (R24) — pure, in-memory, alerts only on violation
// ---------------------------------------------------------------------------

// assertGridRegularity: confirms the empirical invariant that the quarter-hour
// grid is timezone-stable — the viewer's UTC offset and every rendered slot
// minute are multiples of 15. Does NOTHING on the happy path; throws (so a
// caller can log/alert) only on violation. No per-request external I/O.
export const assertGridRegularity = (viewerTz, renderedMinutes = []) => {
  const dt = DateTime.now().setZone(viewerTz);
  if (!dt.isValid) {
    throw new Error(`assertGridRegularity: invalid viewerTz "${viewerTz}"`);
  }
  if (dt.offset % 15 !== 0) {
    throw new Error(
      `Grid-regularity violation: zone "${viewerTz}" has offset ${dt.offset}m (not a multiple of 15)`
    );
  }
  for (const m of renderedMinutes) {
    if (m % 15 !== 0) {
      throw new Error(
        `Grid-regularity violation: rendered minute ${m} is not a multiple of 15 (zone "${viewerTz}")`
      );
    }
  }
};

// Re-export for callers that need to parse/validate an RRULE string elsewhere.
export const parseRRule = (s) => rrulestr(s);

export { RESOLVE };
