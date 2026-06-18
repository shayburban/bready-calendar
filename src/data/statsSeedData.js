/**
 * ⚠️ FAKE / DEMO DATA — NOT REAL.
 * This module procedurally generates ILLUSTRATIVE seed data for the Teacher
 * Statistics page so charts render during development. None of it comes from
 * real users, the backend, or TeacherFinance. The numbers are NOT accurate.
 * It is used ONLY when source:'seed'. It is dropped when source:'supabase'
 * is active and may be deleted before production.
 */
export const IS_DEMO_DATA = true;

import { REVIEW_WINDOW_DAYS, DEFAULT_CANCELLATION_POLICY } from './statsConfig';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Obviously-fake identities (Spec K "Clearly-fake data"). ids prefixed demo_,
// names "Demo …" — never real-looking PII.
const STUDENTS = [
  { id: 'demo_student_01', name: 'Demo Student A' },
  { id: 'demo_student_02', name: 'Demo Student B' },
  { id: 'demo_student_03', name: 'Demo Student C' },
];
const TEACHERS = [
  { id: 'demo_teacher_01', name: 'Demo Teacher X' },
  { id: 'demo_teacher_02', name: 'Demo Teacher Y' },
];
const SUBJECTS = ['Math', 'Spanish', 'Physics', 'Music'];
const SERVICES = ['Online', 'In-Person'];
const RATES = [20, 25, 30, 40, 45];

// The demo teacher's cancellation policy (Spec K — consistent refund/fee
// outcomes). Read like a real per-teacher policy; never inferred from events.
export const DEMO_CANCELLATION_POLICY = { ...DEFAULT_CANCELLATION_POLICY, feeAmount: 50 };

// ── UTC epoch helpers (Spec I — never rely on local time zone) ──────────────
const iso = (ms) => new Date(ms).toISOString();

// A UTC instant `weeksAgo` weeks back (negative = future), on `weekday`
// (0=Sun..6=Sat), at `hour`:00 UTC. Deterministic weekday so the heatmap bands
// are reproducible regardless of "now".
function atWeekdayHour(nowMs, weeksAgo, weekday, hour) {
  const base = new Date(nowMs);
  const deltaToWeekday = weekday - base.getUTCDay();
  const ms = nowMs + deltaToWeekday * DAY - weeksAgo * 7 * DAY;
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, 0, 0);
}

/**
 * Build ONE normalized demo record (Spec C.2 shape). Returns a FAKE record —
 * every field is illustrative. Stamps __demo:true + source:'demo' so any
 * consumer/log/export can detect demo rows; real data never carries these.
 */
function mk(seq, startMs, hours, type, role, extra = {}) {
  const cp =
    role === 'T'
      ? STUDENTS[seq % STUDENTS.length]
      : role === 'S'
      ? TEACHERS[seq % TEACHERS.length]
      : null;
  return {
    id: `demo_evt_${String(seq).padStart(3, '0')}`,
    startUTC: iso(startMs),
    endUTC: iso(startMs + hours * HOUR),
    durationHours: hours,
    type,
    role,
    isReschedule: false,
    requestKind: type === 'waiting' ? 'booking-request' : null,
    status: null,
    counterpartyId: cp ? cp.id : null,
    counterpartyName: cp ? cp.name : null,
    amount: null,
    moneyState: 'none',
    deposited: false,
    cancellationOutcome: null,
    cancellationFee: null,
    reviewWindowEndsUTC: null,
    reviewedByStudent: false,
    disputeOpen: false,
    openedAtUTC: null,
    bookedAtUTC: null,
    subject: SUBJECTS[seq % SUBJECTS.length],
    service: SERVICES[seq % SERVICES.length],
    referred: seq % 3 === 0,
    slotCount: 1,
    moneyFlow: role === 'T' ? 'INFLOW' : role === 'S' ? 'OUTFLOW' : 'NONE',
    __demo: true,
    source: 'demo',
    ...extra,
  };
}

// Money-state presets keep records internally consistent (Spec K dev assertion):
// booked⇒held-escrow, not-reviewed⇒pending-release, completed⇒released,
// cancelled⇒refund|fee. The bucket equals moneyState so reconciliation is an
// identity (Σ buckets === Σ amounts).
function asBooked(rec, amount, openedMs, bookedMs) {
  return {
    ...rec,
    amount,
    moneyState: 'held-escrow',
    deposited: true,
    status: 'accepted',
    openedAtUTC: openedMs ? iso(openedMs) : null,
    bookedAtUTC: bookedMs ? iso(bookedMs) : null,
  };
}
function asNotReviewed(rec, amount, windowEndsMs, reviewed) {
  return {
    ...rec,
    amount,
    moneyState: 'pending-release',
    deposited: true,
    status: 'pending',
    reviewWindowEndsUTC: iso(windowEndsMs),
    reviewedByStudent: !!reviewed,
  };
}
function asCompleted(rec, amount, autoReleased) {
  return {
    ...rec,
    amount,
    moneyState: 'released',
    deposited: true,
    status: autoReleased ? 'expired-auto-released' : 'released',
    reviewedByStudent: !autoReleased,
  };
}
function asCancelledRefund(rec, amount) {
  return { ...rec, amount, moneyState: 'refunded', status: 'refunded', cancellationOutcome: 'refund' };
}
function asCancelledFee(rec, lessonAmount, policy) {
  const fee = Math.round((lessonAmount * policy.feeAmount) / 100);
  return {
    ...rec,
    amount: fee,
    cancellationFee: fee,
    moneyState: 'fee-charged',
    status: 'fee-charged',
    cancellationOutcome: 'fee',
  };
}
function asConvertedAvailability(rec, openedMs, bookedMs) {
  return { ...rec, status: 'converted', openedAtUTC: iso(openedMs), bookedAtUTC: iso(bookedMs) };
}
function asExpiredAvailability(rec, openedMs) {
  return { ...rec, status: 'expired', openedAtUTC: iso(openedMs) };
}

/**
 * ⚠️ Returns FAKE demo records (normalized, C.2 shape) — illustrative ONLY.
 * Procedurally builds 40–80 events from the small counterparty arrays above,
 * looping weekdays/hours/subjects/services, then injects the required edge
 * cases. All timestamps are UTC epoch math relative to `nowMs` so the demo is
 * always fresh. Never import into production paths.
 *
 * @param {number} [nowMs=Date.now()] reference instant (injectable for tests).
 * @returns {Array<Object>} fake normalized records, each with __demo:true.
 */
export function generateSeedData(nowMs = Date.now()) {
  const policy = DEMO_CANCELLATION_POLICY;
  const out = [];
  let seq = 0;
  const next = () => seq++;
  const rate = (i) => RATES[i % RATES.length];

  // ── Heatmap band cells (role-T availability conversion) ────────────────────
  // HIGH (Tue@10): mostly converted -> red.
  for (let i = 0; i < 3; i++) {
    out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 2, 2, 10), 1, 'completed', 'T'), rate(i)));
  }
  out.push(
    asConvertedAvailability(
      mk(next(), atWeekdayHour(nowMs, 1, 2, 10), 1, 'availability', 'T'),
      atWeekdayHour(nowMs, 3, 2, 10),
      atWeekdayHour(nowMs, 2, 2, 10)
    )
  );
  out.push(asExpiredAvailability(mk(next(), atWeekdayHour(nowMs, 1, 2, 10), 1, 'availability', 'T'), atWeekdayHour(nowMs, 2, 2, 10)));

  // MEDIUM (Thu@14): ~50% -> orange.
  out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 2, 4, 14), 1, 'completed', 'T'), rate(1)));
  out.push(asExpiredAvailability(mk(next(), atWeekdayHour(nowMs, 1, 4, 14), 1, 'availability', 'T'), atWeekdayHour(nowMs, 2, 4, 14)));

  // LOW (Sat@8): mostly unsold -> green.
  out.push(
    asConvertedAvailability(
      mk(next(), atWeekdayHour(nowMs, 1, 6, 8), 1, 'availability', 'T'),
      atWeekdayHour(nowMs, 3, 6, 8),
      atWeekdayHour(nowMs, 2, 6, 8)
    )
  );
  for (let i = 0; i < 3; i++) {
    out.push(asExpiredAvailability(mk(next(), atWeekdayHour(nowMs, 1 + i, 6, 8), 1, 'availability', 'T'), atWeekdayHour(nowMs, 2 + i, 6, 8)));
  }

  // DEAD-ZONE (Mon@7): >=3 unconverted, 0% -> deepest green + flagged.
  for (let i = 0; i < 4; i++) {
    out.push(asExpiredAvailability(mk(next(), atWeekdayHour(nowMs, 1 + i, 1, 7), 1, 'availability', 'T'), atWeekdayHour(nowMs, 2 + i, 1, 7)));
  }

  // ── General PAST coverage (completed / not-reviewed / cancelled), both roles ─
  const pastSchedule = [
    { wd: 3, hr: 9 },
    { wd: 5, hr: 11 },
    { wd: 1, hr: 13 },
    { wd: 4, hr: 16 },
    { wd: 2, hr: 18 },
  ];
  pastSchedule.forEach((slot, i) => {
    const weeksAgo = 2 + (i % 6);
    const start = atWeekdayHour(nowMs, weeksAgo, slot.wd, slot.hr);
    const hrs = 1 + (i % 3); // 1..3 h
    const r = rate(i) * hrs;
    // Role T completed (you teach -> inflow, released)
    out.push(asCompleted(mk(next(), start, hrs, 'completed', 'T'), r, i % 2 === 0));
    // Role S completed (you study -> outflow, released)
    out.push(asCompleted(mk(next(), start + DAY, hrs, 'completed', 'S'), r));
    // Role T not-reviewed (pending release), window 0..REVIEW_WINDOW_DAYS out
    out.push(
      asNotReviewed(
        mk(next(), atWeekdayHour(nowMs, 0, slot.wd, slot.hr) - DAY, hrs, 'not-reviewed', 'T'),
        r,
        nowMs + (i % (REVIEW_WINDOW_DAYS + 1)) * DAY,
        i % 2 === 0
      )
    );
  });

  // ── NOW / recent: waiting (both kinds), disputes ───────────────────────────
  out.push(mk(next(), nowMs + 2 * DAY, 1, 'waiting', 'T', { requestKind: 'booking-request', status: 'pending' }));
  out.push(mk(next(), nowMs + 3 * DAY, 1, 'waiting', 'S', { requestKind: 'booking-request', status: 'pending' }));
  // a rejected request (drop-off)
  out.push(mk(next(), nowMs - 2 * DAY, 1, 'waiting', 'T', { requestKind: 'booking-request', status: 'rejected' }));
  // a reschedule waiting (never a new booking)
  out.push(mk(next(), nowMs + 1 * DAY, 1, 'waiting', 'T', { requestKind: 'reschedule', isReschedule: true, status: 'pending' }));

  // ── NEAR future: upcoming booked + still-open availability ──────────────────
  for (let i = 0; i < 4; i++) {
    const start = atWeekdayHour(nowMs, -1 - (i % 2), 3 + (i % 3), 10 + i);
    const hrs = 1 + (i % 2);
    out.push(
      asBooked(
        mk(next(), start, hrs, 'booked', i % 2 === 0 ? 'T' : 'S'),
        rate(i) * hrs,
        nowMs - 5 * DAY,
        nowMs - 1 * DAY
      )
    );
  }
  out.push(mk(next(), atWeekdayHour(nowMs, -1, 5, 9), 2, 'availability', 'T', { status: 'open', slotCount: 2 }));

  // ── Synced (>=2) — MUST be excluded from every stat ────────────────────────
  out.push(mk(next(), nowMs - 4 * DAY, 1, 'synced', null));
  out.push(mk(next(), nowMs + 4 * DAY, 1, 'synced', null));

  // ── Required injected edge cases (Spec K — guaranteed, not left to chance) ──
  // dispute resolved to refund
  out.push({
    ...asNotReviewed(mk(next(), nowMs - DAY, 1, 'not-reviewed', 'T'), 35, nowMs + DAY, false),
    disputeOpen: true,
    status: 'refunded',
    moneyState: 'refunded',
    cancellationOutcome: 'refund',
  });
  // dispute resolved to release
  out.push({
    ...asNotReviewed(mk(next(), nowMs - DAY, 1, 'not-reviewed', 'T'), 40, nowMs + DAY, false),
    disputeOpen: true,
    status: 'released',
    moneyState: 'released',
  });
  // auto-released completion
  out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 3, 3, 12), 1, 'completed', 'T'), 30, true));
  // reviewed-released completion
  out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 3, 5, 15), 1, 'completed', 'T'), 30, false));
  // refund cancellation — role T (student gets refunded; not your money)
  out.push(asCancelledRefund(mk(next(), atWeekdayHour(nowMs, 2, 2, 11), 1, 'cancelled', 'T'), 25));
  // refund cancellation — role S (YOU were the student-payer -> Refund(S) to you)
  out.push(asCancelledRefund(mk(next(), atWeekdayHour(nowMs, 2, 6, 16), 1, 'cancelled', 'S'), 20));
  // fee cancellation (per policy)
  out.push(asCancelledFee(mk(next(), atWeekdayHour(nowMs, 2, 4, 13), 1, 'cancelled', 'T'), 50, policy));
  // trial lessons (role T, flagged) so the Total Trial Lessons ($) card is real
  out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 4, 2, 9), 1, 'completed', 'T', { isTrial: true }), 15));
  out.push(asCompleted(mk(next(), atWeekdayHour(nowMs, 4, 4, 11), 1, 'completed', 'T', { isTrial: true }), 15));
  // an accepted + a declined reschedule, so accept/decline rates are non-trivial
  out.push(mk(next(), nowMs - 3 * DAY, 1, 'waiting', 'S', { requestKind: 'reschedule', isReschedule: true, status: 'accepted' }));
  out.push(mk(next(), nowMs - 6 * DAY, 1, 'waiting', 'T', { requestKind: 'reschedule', isReschedule: true, status: 'declined' }));

  // Dev reconciliation assertion (Spec K "Dev assertion"). Non-fatal — warn only.
  assertReconciliation(out);
  return out;
}

// Σ held-escrow + Σ pending-release + Σ released + Σ refunded + Σ fee-charged
// must tie to Σ of all valid amounts, and the per-type money-state invariants
// must hold. Logs a console.warn if any invariant fails (never throws).
export function assertReconciliation(records) {
  const buckets = {
    'held-escrow': 0,
    'pending-release': 0,
    released: 0,
    refunded: 0,
    'fee-charged': 0,
  };
  let totalAmount = 0;
  const problems = [];
  for (const r of records) {
    if (Number.isFinite(r.amount)) {
      totalAmount += r.amount;
      if (r.moneyState in buckets) buckets[r.moneyState] += r.amount;
      else problems.push(`amount-bearing ${r.id} has moneyState '${r.moneyState}' (not a bucket)`);
    }
    if (r.type === 'completed' && r.moneyState !== 'released')
      problems.push(`${r.id}: completed but not released`);
    if (r.type === 'booked' && r.moneyState !== 'held-escrow')
      problems.push(`${r.id}: booked but not held-escrow`);
    if (r.type === 'not-reviewed' && !['pending-release', 'refunded', 'released'].includes(r.moneyState))
      problems.push(`${r.id}: not-reviewed money-state '${r.moneyState}'`);
    if (r.type === 'cancelled' && !['refund', 'fee'].includes(r.cancellationOutcome))
      problems.push(`${r.id}: cancelled without refund|fee outcome`);
  }
  const bucketSum = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (Math.abs(bucketSum - totalAmount) > 0.01)
    problems.push(`reconciliation mismatch: buckets ${bucketSum} != amounts ${totalAmount}`);
  if (problems.length) {
    console.warn('[TeacherStatistics] DEMO seed reconciliation issues:', problems);
  }
  return { ok: problems.length === 0, problems, buckets, totalAmount };
}

// One-time runtime warning emitted by the hook when the seed source is active
// (Spec K "Runtime warning"). Guarded so it only fires once per session.
let _warned = false;
export function warnDemoActive() {
  if (_warned) return;
  _warned = true;
  console.warn(
    '[TeacherStatistics] DEMO data active — all figures are ILLUSTRATIVE/FAKE, not real.'
  );
}
