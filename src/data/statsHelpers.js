// Teacher Statistics — pure aggregation/normalisation layer (Spec Sections C, I, G).
//
// This module is the ONLY place that knows how to turn a raw source row
// (legacy sampleEvents, the demo seed, or a Supabase get_my_bookings row) into
// the single NormalizedRecord shape (Spec C.2). Every statistic is then a
// groupBy + sum/count/distinct over that one record type, so swapping the
// source never touches the stats UI.
//
// HARD RULES honoured here (Spec A):
//  - role is the OWNER's perspective; counterparty is always the opposite role
//    and is NEVER inferred from the counterparty field (C.1 mapping lock).
//  - money comes ONLY from finance/seed amounts — never from calendar events,
//    duration, type or labels (A#5).
//  - synced / seq-saved / seq-edited are excluded from lesson/earning stats (A#7).
//  - unparseable money/duration -> null and the row is excluded from that sum,
//    never crashing the pipeline (I "Fail safe").

import { EXCLUDED_TYPES, HEATMAP_BANDS, DEAD_ZONE_MIN_OCCURRENCES } from './statsConfig';

// ───────────────────────────── parsing helpers (Spec I) ─────────────────────

// Normalise en-dash and other dash variants to a plain hyphen before parsing
// time ranges (Spec I "Dashes").
export function normalizeDashes(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[‐-―−]/g, '-');
}

// Robustly parse a 'HH:MM - HH:MM' OR 'HH:MM-HH:MM' range -> { startHour, endHour }
// (fractional hours). Handles BOTH spaced and unspaced forms and dash variants
// (Spec I "Dashes" / "Times appear spaced ... and unspaced"). The existing
// sampleEvents.parseTimeRange only splits on ' - ', so it cannot parse the
// unspaced timeSlots — hence this dedicated parser. Returns null when unusable.
export function parseHourSpan(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const norm = normalizeDashes(timeStr).replace(/\s+/g, '');
  const parts = norm.split('-');
  if (parts.length !== 2) return null;
  const toFloat = (s) => {
    const [h, m] = s.split(':').map((v) => parseInt(v, 10));
    if (!Number.isFinite(h)) return null;
    return h + (Number.isFinite(m) ? m : 0) / 60;
  };
  const startHour = toFloat(parts[0]);
  const endHour = toFloat(parts[1]);
  if (startHour == null || endHour == null) return null;
  return { startHour, endHour };
}

// Money: match all numeric runs, take the LAST (e.g. 30 from '10 $ * 3 Hr = 30 $').
// No match -> null. (Spec I "Money".)
export function parseMoney(str) {
  if (str == null) return null;
  if (typeof str === 'number') return Number.isFinite(str) ? str : null;
  const matches = String(str).match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const val = parseFloat(matches[matches.length - 1]);
  return Number.isFinite(val) ? val : null;
}

// Duration: try '3 Hours' style first; else derive from a 'HH:MM - HH:MM' range.
// No usable value -> null. (Spec I "Duration".)
export function parseDuration(str, timeRange) {
  if (typeof str === 'number' && Number.isFinite(str)) return str;
  if (typeof str === 'string') {
    const m = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)/i);
    if (m) {
      const v = parseFloat(m[1]);
      if (Number.isFinite(v)) return v;
    }
  }
  if (timeRange && typeof timeRange === 'string') {
    const span = parseHourSpan(timeRange);
    if (span) {
      const diff = span.endHour - span.startHour;
      if (Number.isFinite(diff) && diff > 0) return diff;
    }
  }
  return null;
}

// Pure UTC-epoch deadline math — never relies on local browser time zone
// (Spec I "UTC timestamp math"). `fromMs` defaults to Date.now() via the caller.
export function addDaysUTC(fromMs, days) {
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}

// The legacy sampleEvents carry only a day-of-month + 'HH:MM - HH:MM' and live
// (per their own header) inside April 2026. Build a UTC instant from that so the
// mock path produces real startUTC/endUTC. Mock-only; production uses real
// instants. Returns ISO string.
function mockUTCInstant(dayOfMonth, hourFloat) {
  const year = 2026;
  const monthIndex = 3; // April (0-based)
  const h = Math.floor(hourFloat);
  const min = Math.round((hourFloat - h) * 60);
  return new Date(Date.UTC(year, monthIndex, dayOfMonth || 1, h, min, 0)).toISOString();
}

// ───────────────────────────── normaliser (Spec C.2) ───────────────────────

// role -> counterparty mapping. Implemented EXACTLY per the C.1 snippet so it is
// never "reasoned about" inline (the #1 silent-bug source).
export function counterpartyOf(role, rawEvent) {
  // role is the OWNER's perspective: 'T' = owner teaches, 'S' = owner studies.
  if (role === 'T') return rawEvent.student ?? null;
  if (role === 'S') return rawEvent.teacher ?? null;
  return null;
}
export function moneyFlowOf(role) {
  return role === 'T' ? 'INFLOW' : role === 'S' ? 'OUTFLOW' : 'NONE';
}

// Conceptual money bucket for a type when the source has no explicit moneyState
// (legacy mock). Drives lifecycle bucket display only; amounts stay null in mock
// so money TOTALS still resolve to "—" (Spec H mock-mode expectation).
function defaultMoneyStateForType(type) {
  switch (type) {
    case 'booked':
      return 'held-escrow';
    case 'not-reviewed':
      return 'pending-release';
    case 'completed':
      return 'released';
    default:
      return 'none';
  }
}

// Normalise ONE raw legacy/sample event (+ optional finance row) -> NormalizedRecord.
// The seed (statsSeedData) builds records in this shape directly; production maps
// get_my_bookings into it. Many fields are additive/optional with safe fallbacks
// (Spec A#11) so a missing field never blocks the page.
export function normalizeEvent(rawEvent, financeRow) {
  const role = rawEvent.role || null;
  const type = rawEvent.type;
  const timeStr = normalizeDashes(rawEvent.time || '');
  const span = parseHourSpan(timeStr) || { startHour: 0, endHour: 1 };
  const { startHour, endHour } = span;

  // Multi-slot availability: never undercount (Spec G "Multi-slot").
  const slots = Array.isArray(rawEvent.timeSlots) ? rawEvent.timeSlots : null;
  const slotCount = slots ? slots.length : rawEvent.count || 1;

  // Hours: sum per-slot durations for multi-slot; else the single range.
  let durationHours = null;
  if (slots && slots.length > 0) {
    durationHours = slots.reduce((sum, s) => {
      const d = parseDuration(null, normalizeDashes(s));
      return sum + (d || 0);
    }, 0);
  }
  if (durationHours == null || durationHours === 0) {
    durationHours = parseDuration(financeRow?.duration, timeStr);
  }

  // Money ONLY from finance/production fields (A#5) — never from the event's
  // duration/type/labels. Mock has no join and sampleEvents carry no price ->
  // null (so money totals correctly show "—"). Production rows carry it directly.
  const amount = financeRow
    ? parseMoney(financeRow.total)
    : rawEvent.amount != null
    ? parseMoney(rawEvent.amount)
    : null;
  const moneyState = financeRow?.moneyState || rawEvent.moneyState || defaultMoneyStateForType(type);

  // Production rows carry real UTC instants; mock derives them from date+time.
  const startUTC = rawEvent.startUTC || mockUTCInstant(rawEvent.date, startHour);
  const endUTC = rawEvent.endUTC || mockUTCInstant(rawEvent.date, endHour);

  return {
    id: rawEvent.id != null ? `evt_${rawEvent.id}` : `evt_${Math.abs(hashCode(JSON.stringify(rawEvent)))}`,
    startUTC,
    endUTC,
    durationHours,
    type,
    role,
    isReschedule: !!rawEvent.reschedule,
    requestKind:
      type === 'waiting' ? (rawEvent.reschedule ? 'reschedule' : 'booking-request') : null,
    status: rawEvent.status || null,
    counterpartyId: counterpartyOf(role, rawEvent),

    amount,
    moneyState,
    deposited: financeRow ? !!financeRow.deposited : !!rawEvent.deposited,
    cancellationOutcome: rawEvent.cancellationOutcome ?? null,
    cancellationFee: rawEvent.cancellationFee ?? null,

    reviewWindowEndsUTC: rawEvent.reviewWindowEndsUTC ?? null,
    reviewedByStudent: rawEvent.reviewedByStudent ?? false,
    disputeOpen: rawEvent.disputeOpen ?? false,

    openedAtUTC: rawEvent.openedAtUTC ?? null,
    bookedAtUTC: rawEvent.bookedAtUTC ?? null,

    subject: financeRow?.subject || rawEvent.subject || null,
    service: financeRow?.service || rawEvent.service || null,
    referred: financeRow ? !!financeRow.referred : !!rawEvent.referred,

    slotCount,
    moneyFlow: moneyFlowOf(role),
    __demo: rawEvent.__demo === true,
  };
}

export function normalizeEvents(rawEvents, financeRows) {
  if (!Array.isArray(rawEvents)) return [];
  return rawEvents.map((e) => normalizeEvent(e, matchFinanceRow(e, financeRows)));
}

// Best-effort finance join. The legacy sources share NO key (Spec 0/C.2 — "do
// not invent a key"), so this returns null unless a caller passes pre-joined
// rows keyed by id. Kept as a seam for production where the join is real.
function matchFinanceRow(rawEvent, financeRows) {
  if (!Array.isArray(financeRows) || financeRows.length === 0) return null;
  return financeRows.find((f) => f && f.id != null && f.id === rawEvent.id) || null;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// ───────────────────────────── filtering / slicers ─────────────────────────

export function isExcluded(rec) {
  return EXCLUDED_TYPES.includes(rec.type);
}

// Keep only records that count toward lesson/earning stats.
export function lessonRecords(records) {
  return records.filter((r) => !isExcluded(r));
}

// Period + slicer filtering (Spec G "Slicers"). All fields optional; an absent
// filter is a no-op so the page's existing controls keep working over every stat.
export function applyFilters(records, opts = {}) {
  const { fromUTC, untilUTC, student, subject, service, referred } = opts;
  return records.filter((r) => {
    if (fromUTC && r.startUTC && r.startUTC < fromUTC) return false;
    if (untilUTC && r.startUTC && r.startUTC > untilUTC) return false;
    if (student && r.counterpartyId) {
      if (!String(r.counterpartyId).toLowerCase().includes(String(student).toLowerCase()))
        return false;
    }
    if (subject && r.subject !== subject) return false;
    if (service && r.service !== service) return false;
    if (referred != null && !!r.referred !== !!referred) return false;
    return true;
  });
}

// Period windows for the page's Month / Week / Entire-Time tabs. A symmetric
// window around `nowMs` so the temporal spread (recent past + near future) is
// captured; 'entire' applies no date bound. Returns {fromUTC, untilUTC} or {}.
export function periodRange(period, nowMs = Date.now()) {
  const DAY = 24 * 60 * 60 * 1000;
  if (period === 'week') {
    return { fromUTC: new Date(nowMs - 7 * DAY).toISOString(), untilUTC: new Date(nowMs + 7 * DAY).toISOString() };
  }
  if (period === 'month') {
    return { fromUTC: new Date(nowMs - 31 * DAY).toISOString(), untilUTC: new Date(nowMs + 31 * DAY).toISOString() };
  }
  return {}; // entire
}

// ───────────────────────────── generic aggregate (Spec C.3) ────────────────

// groupBy type+role+reschedule (the single aggregation key, A#4). Returns an
// object keyed by 'type|role|reschedule' with { count, hours, amount, ids }.
// Color is NEVER a grouping key.
export function aggregate(records, opts = {}) {
  const { includeExcluded = false } = opts;
  const src = includeExcluded ? records : lessonRecords(records);
  const groups = {};
  for (const r of src) {
    const key = `${r.type}|${r.role || '-'}|${r.isReschedule ? 'resched' : 'new'}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        type: r.type,
        role: r.role || null,
        isReschedule: r.isReschedule,
        count: 0,
        hours: 0,
        amount: 0,
        amountKnown: false,
        ids: new Set(),
        counterparties: new Set(),
      };
    }
    const g = groups[key];
    g.count += 1;
    if (Number.isFinite(r.durationHours)) g.hours += r.durationHours;
    if (Number.isFinite(r.amount)) {
      g.amount += r.amount;
      g.amountKnown = true;
    }
    g.ids.add(r.id);
    if (r.counterpartyId) g.counterparties.add(r.counterpartyId);
  }
  return groups;
}

// ───────────────────────────── small reducers ──────────────────────────────

const isLesson = (r, type, role) =>
  r.type === type && (role == null || r.role === role) && !isExcluded(r);
const isBookedOrCompleted = (r) => r.type === 'booked' || r.type === 'completed';

export function sumHours(records, predicate) {
  return records.reduce(
    (s, r) => (predicate(r) && Number.isFinite(r.durationHours) ? s + r.durationHours : s),
    0
  );
}
export function sumAmount(records, predicate) {
  // Returns { value, known } so callers can render "—" when nothing is known.
  let value = 0;
  let known = false;
  for (const r of records) {
    if (predicate(r) && Number.isFinite(r.amount)) {
      value += r.amount;
      known = true;
    }
  }
  return { value, known };
}
export function distinctCount(records, predicate, keyFn = (r) => r.counterpartyId) {
  const set = new Set();
  for (const r of records) {
    if (predicate(r)) {
      const k = keyFn(r);
      if (k) set.add(k);
    }
  }
  return set.size;
}

// Format a money result as a display value: a number, or "—" when unknown.
export function moneyDisplay({ value, known }) {
  return known ? value : '—';
}

// ───────────────────────────── G.1 stat cards ──────────────────────────────

export function computeStatCards(records) {
  const recs = lessonRecords(records);

  // Hours where YOU studied (role S) — booked or completed.
  const hoursAsStudent = sumHours(recs, (r) => r.role === 'S' && isBookedOrCompleted(r));
  // Hours where YOU taught (role T) — booked or completed.
  const hoursAsTeacher = sumHours(recs, (r) => r.role === 'T' && isBookedOrCompleted(r));

  // Refund ($) — refund-outcome cancellations (Refund(S)). ⚙️ needs money fields.
  const refund = sumAmount(
    recs,
    (r) => r.type === 'cancelled' && r.cancellationOutcome === 'refund'
  );

  // Distinct students across role-T bookings/completions.
  const studentsBooked = distinctCount(
    recs,
    (r) => r.role === 'T' && isBookedOrCompleted(r)
  );

  // New students 🏭 — distinct role-T counterparties whose FIRST lesson is in the
  // (already-filtered) period. Approximated as distinct here; production refines.
  const newStudents = studentsBooked;

  // Trial lessons ($) ⚙️ — no trial flag in the data yet -> unknown.
  const trial = sumAmount(recs, (r) => r.isTrial === true);

  return {
    trialLessons: moneyDisplay(trial),
    hoursForTeachers: round1(hoursAsStudent), // "Hours Booked For Teachers" = you study
    meetingsWithStudents: round1(hoursAsTeacher), // "Meetings With Students" = you teach
    refund: moneyDisplay(refund),
    studentsBooked,
    newStudents,
  };
}

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

// ───────────────────────────── G.2 conversion ──────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function weekdayOf(rec) {
  return new Date(rec.startUTC).getUTCDay();
}
export function hourOf(rec) {
  return new Date(rec.startUTC).getUTCHours();
}
export function weekdayLabel(idx) {
  return WEEKDAY_LABELS[idx] ?? String(idx);
}

// Conversion by (weekday x hour) for role-T availability. "offered" = role-T
// availability slots at that cell; "booked" = those that converted. We treat a
// past availability as converted when it has a bookedAtUTC, and unconverted when
// it expired. booked/completed/not-reviewed role-T events also count toward the
// converted tally for that cell so high-converting times read as "hot".
export function computeConversionGrid(records) {
  const recs = lessonRecords(records);
  // cell key -> { offered, booked }
  const cells = {};
  const ensure = (wd, hr) => {
    const k = `${wd}|${hr}`;
    if (!cells[k]) cells[k] = { weekday: wd, hour: hr, offered: 0, booked: 0 };
    return cells[k];
  };

  for (const r of recs) {
    if (r.role !== 'T') continue;
    const wd = weekdayOf(r);
    const hr = hourOf(r);
    if (r.type === 'availability') {
      const c = ensure(wd, hr);
      const n = r.slotCount || 1;
      c.offered += n;
      if (r.bookedAtUTC || r.status === 'converted') c.booked += n;
    } else if (
      r.type === 'booked' ||
      r.type === 'completed' ||
      r.type === 'not-reviewed'
    ) {
      // A realised booking implies the slot was both offered and converted.
      const c = ensure(wd, hr);
      c.offered += 1;
      c.booked += 1;
    }
  }

  return Object.values(cells).map((c) => ({
    ...c,
    conversion: c.offered > 0 ? c.booked / c.offered : null,
    band: bandFor(c.offered > 0 ? c.booked / c.offered : null),
  }));
}

export function bandFor(conversion) {
  if (conversion == null) return 'no-data';
  if (conversion >= HEATMAP_BANDS.high) return 'high';
  if (conversion >= HEATMAP_BANDS.low) return 'medium';
  return 'low';
}

// Conversion funnel (Spec D + G.2). No double-counting of reschedules: a
// reschedule waiting is a separate pipeline event, never a new booking.
export function computeFunnel(records) {
  const recs = lessonRecords(records);
  const count = (pred) => recs.filter(pred).length;

  const availabilityOffered = recs
    .filter((r) => r.type === 'availability' && r.role === 'T')
    .reduce((s, r) => s + (r.slotCount || 1), 0);

  const bookingRequests = count(
    (r) => r.type === 'waiting' && r.requestKind === 'booking-request'
  );
  const reschedules = count((r) => r.type === 'waiting' && r.requestKind === 'reschedule');
  const booked = count((r) => r.type === 'booked' && !r.isReschedule);
  const notReviewed = count((r) => r.type === 'not-reviewed');
  const completed = count((r) => r.type === 'completed');

  // Drop-offs
  const rejected = count((r) => r.type === 'waiting' && r.status === 'rejected');
  const cancelled = count((r) => r.type === 'cancelled'); // only from booked (D)
  const disputedRefund = count(
    (r) => r.type === 'not-reviewed' && r.disputeOpen && r.status === 'refunded'
  );
  const wastedSupply = recs
    .filter(
      (r) =>
        r.type === 'availability' &&
        r.role === 'T' &&
        (r.status === 'expired' || (!r.bookedAtUTC && isPast(r.endUTC)))
    )
    .reduce((s, r) => s + (r.slotCount || 1), 0);

  return {
    stages: [
      { key: 'availability', label: 'Availability / Requests', value: availabilityOffered + bookingRequests },
      { key: 'waiting', label: 'Waiting', value: bookingRequests },
      { key: 'booked', label: 'Booked', value: booked },
      { key: 'not-reviewed', label: 'Not Reviewed', value: notReviewed },
      { key: 'completed', label: 'Completed', value: completed },
    ],
    dropoffs: { rejected, cancelled, disputedRefund, wastedSupply },
    reschedules,
  };
}

function isPast(iso) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

// Fill / Utilization — booked hours / available hours, clamped 0..100% (G.2).
export function computeUtilization(records) {
  const recs = lessonRecords(records);
  const availableHours = sumHours(
    recs,
    (r) => r.type === 'availability' && r.role === 'T'
  );
  const bookedHours = sumHours(
    recs,
    (r) => r.role === 'T' && isBookedOrCompleted(r)
  );
  const denom = availableHours + bookedHours;
  const rate = denom > 0 ? Math.min(1, bookedHours / denom) : 0;
  return { availableHours: round1(availableHours), bookedHours: round1(bookedHours), rate };
}

// ───────────────────────────── G.3 wasted supply / dead-zones ──────────────

export function computeWastedSupply(records) {
  const recs = lessonRecords(records);
  const pastAvail = recs.filter(
    (r) => r.type === 'availability' && r.role === 'T' && isPast(r.endUTC)
  );
  const totalSlots = pastAvail.reduce((s, r) => s + (r.slotCount || 1), 0);
  const unconverted = pastAvail.filter((r) => !r.bookedAtUTC && r.status !== 'converted');
  const idleSlots = unconverted.reduce((s, r) => s + (r.slotCount || 1), 0);
  const idleHours = unconverted.reduce(
    (s, r) => s + (Number.isFinite(r.durationHours) ? r.durationHours : 0),
    0
  );
  return {
    totalPastSlots: totalSlots,
    idleSlots,
    idleHours: round1(idleHours),
    pctUnbooked: totalSlots > 0 ? idleSlots / totalSlots : 0,
  };
}

// Dead-zone detection (Spec G.3 concrete heuristic): group past UNCONVERTED
// role-T availability by (weekday, hour); flag when occurrences >= threshold AND
// 0% conversion at that cell.
export function detectDeadZones(records) {
  const grid = computeConversionGrid(records);
  const byCell = {};
  for (const c of grid) byCell[`${c.weekday}|${c.hour}`] = c;

  const recs = lessonRecords(records);
  const occ = {};
  for (const r of recs) {
    if (r.type !== 'availability' || r.role !== 'T') continue;
    if (!isPast(r.endUTC)) continue;
    if (r.bookedAtUTC || r.status === 'converted') continue;
    const k = `${weekdayOf(r)}|${hourOf(r)}`;
    occ[k] = (occ[k] || 0) + 1;
  }
  const zones = [];
  for (const [k, n] of Object.entries(occ)) {
    const cell = byCell[k];
    const conv = cell ? cell.conversion : 0;
    if (n >= DEAD_ZONE_MIN_OCCURRENCES && (conv == null || conv === 0)) {
      const [wd, hr] = k.split('|').map(Number);
      zones.push({
        weekday: wd,
        hour: hr,
        occurrences: n,
        message: `You've had unbooked openings on ${weekdayLabel(wd)}s at ${formatHour(
          hr
        )} ${n} times with no bookings. Consider moving this slot to a higher-converting time.`,
      });
    }
  }
  return zones.sort((a, b) => b.occurrences - a.occurrences);
}

export function formatHour(h) {
  const hh = ((h % 24) + 24) % 24;
  const ampm = hh < 12 ? 'AM' : 'PM';
  const disp = hh % 12 === 0 ? 12 : hh % 12;
  return `${disp}:00 ${ampm}`;
}

// Cancellation + reschedule rates (G.3 / G.5).
export function computeRates(records) {
  const recs = lessonRecords(records);
  const cancelled = recs.filter((r) => r.type === 'cancelled').length;
  const reschedules = recs.filter((r) => r.isReschedule).length;
  const realisedish = recs.filter(
    (r) => isBookedOrCompleted(r) || r.type === 'not-reviewed' || r.type === 'cancelled'
  ).length;
  const denom = realisedish || 1;
  return {
    cancelled,
    reschedules,
    cancellationRate: cancelled / denom,
    rescheduleRate: reschedules / denom,
  };
}

// ───────────────────────────── G.4 money / escrow ──────────────────────────

export function computeMoneyEscrow(records) {
  const recs = lessonRecords(records);

  const inEscrow = sumAmount(recs, (r) => r.role === 'T' && r.type === 'booked');
  const pendingRelease = sumAmount(recs, (r) => r.role === 'T' && r.type === 'not-reviewed');
  const released = sumAmount(recs, (r) => r.role === 'T' && r.type === 'completed');
  const reviewedReleased = sumAmount(
    recs,
    (r) =>
      r.role === 'T' && r.type === 'completed' && r.status !== 'expired-auto-released'
  );
  const autoReleased = sumAmount(
    recs,
    (r) =>
      r.role === 'T' && r.type === 'completed' && r.status === 'expired-auto-released'
  );

  const refunds = sumAmount(recs, (r) => r.type === 'cancelled' && r.cancellationOutcome === 'refund');
  const fees = sumAmount(recs, (r) => r.type === 'cancelled' && r.cancellationOutcome === 'fee');
  const refundCount = recs.filter(
    (r) => r.type === 'cancelled' && r.cancellationOutcome === 'refund'
  ).length;
  const feeCount = recs.filter(
    (r) => r.type === 'cancelled' && r.cancellationOutcome === 'fee'
  ).length;

  const disputes = recs.filter((r) => r.disputeOpen);
  const disputeRefunded = disputes.filter((r) => r.status === 'refunded').length;
  const disputeReleased = disputes.filter((r) => r.status === 'released').length;

  const notReviewed = recs.filter((r) => r.type === 'not-reviewed');
  const reviewedNR = notReviewed.filter((r) => r.reviewedByStudent).length;

  return {
    inEscrow: moneyDisplay(inEscrow),
    pendingRelease: moneyDisplay(pendingRelease),
    released: moneyDisplay(released),
    reviewedReleased: moneyDisplay(reviewedReleased),
    autoReleased: moneyDisplay(autoReleased),
    refunds: moneyDisplay(refunds),
    fees: moneyDisplay(fees),
    refundCount,
    feeCount,
    disputeCount: disputes.length,
    disputeRefunded,
    disputeReleased,
    reviewRate: notReviewed.length ? reviewedNR / notReviewed.length : null,
  };
}

// ───────────────────────────── G.5 lifecycle / pipeline ────────────────────

export function computeLifecycle(records) {
  const recs = lessonRecords(records);
  const TYPES = ['availability', 'waiting', 'booked', 'not-reviewed', 'completed', 'cancelled'];
  const stateCounts = {};
  for (const t of TYPES) {
    stateCounts[t] = {
      T: recs.filter((r) => r.type === t && r.role === 'T').length,
      S: recs.filter((r) => r.type === t && r.role === 'S').length,
    };
  }

  const reschedule = {
    total: recs.filter((r) => r.isReschedule).length,
    accepted: recs.filter((r) => r.isReschedule && r.status === 'accepted').length,
    declined: recs.filter((r) => r.isReschedule && r.status === 'declined').length,
  };

  const requests = recs.filter((r) => r.type === 'waiting' && r.requestKind === 'booking-request');
  const pipeline = {
    requests: requests.length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return { stateCounts, reschedule, pipeline };
}

// ───────────────────────────── G.6 people / workload ───────────────────────

export function computePeople(records) {
  const recs = lessonRecords(records);
  const uniqueStudents = distinctCount(recs, (r) => r.role === 'T' && isBookedOrCompleted(r));
  const uniqueTeachers = distinctCount(recs, (r) => r.role === 'S' && isBookedOrCompleted(r));

  // Top students by teaching hours (role T).
  const byStudent = {};
  for (const r of recs) {
    if (r.role === 'T' && isBookedOrCompleted(r) && r.counterpartyId) {
      byStudent[r.counterpartyId] =
        (byStudent[r.counterpartyId] || 0) + (Number.isFinite(r.durationHours) ? r.durationHours : 0);
    }
  }
  const topStudents = Object.entries(byStudent)
    .map(([id, hours]) => ({ id, hours: round1(hours) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  const teachingHours = sumHours(recs, (r) => r.role === 'T' && isBookedOrCompleted(r));

  return { uniqueStudents, uniqueTeachers, topStudents, teachingHours: round1(teachingHours) };
}

// ───────────────────────────── drill-down rows ─────────────────────────────

// Flatten a predicate-selected slice of records into read-only display rows for
// the drawer (Spec J "Drill-down").
export function toDrawerRows(records, predicate) {
  return records
    .filter(predicate)
    .map((r) => ({
      id: r.id,
      date: r.startUTC ? new Date(r.startUTC).toISOString().slice(0, 10) : '—',
      type: r.type,
      role: r.role || '—',
      counterparty: r.counterpartyId || '—',
      durationHours: Number.isFinite(r.durationHours) ? r.durationHours : '—',
      moneyState: r.moneyState || '—',
      amount: Number.isFinite(r.amount) ? r.amount : '—',
      outcome: r.cancellationOutcome || (r.disputeOpen ? 'dispute' : r.status) || '—',
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
