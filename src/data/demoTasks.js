/**
 * FAKE / DEMO DATA — sample bookings for UI testing only. Not real. Never served
 * as live data. See DEMO_DATA.md.
 *
 * Procedurally builds raw event-shaped records for the Teacher Task Manager so the
 * full UI can be verified WITHOUT real bookings. These flow through the SAME
 * `normalizeEvents` pipeline the calendar/Statistics use, so testing the demo
 * tests the real rendering path. Every record is unmistakable as fake:
 *  - `isDemo: true` (+ `__demo: true`)
 *  - `demo-` prefixed, NON-UUID ids (demo-bk-001) — cannot collide with real UUIDs
 *  - placeholder names (Demo Student 01 / Sample Tutor — Alex Example), @example.com
 *  - sample subjects (Demo: Algebra (sample))
 * Deterministic content, but dates are computed RELATIVE to today so there are
 * always past + upcoming rows.
 */
export const IS_DEMO_TASKS = true;

export const DEMO_TASKS_BANNER =
  '⚠️ DEMO DATA — sample bookings for testing. Nothing here is real and no changes are saved.';

const HOUR = 60 * 60 * 1000;

const STUDENTS = [
  { name: 'Demo Student 01', email: 'student01@example.com' },
  { name: 'Demo Student 02', email: 'student02@example.com' },
  { name: 'Demo Student 03', email: 'student03@example.com' },
  { name: 'Demo Student 04', email: 'student04@example.com' },
  { name: 'Demo Student 05', email: 'student05@example.com' },
];
const TUTORS = [
  { name: 'Sample Tutor — Alex Example', email: 'alex@example.com' },
  { name: 'Sample Tutor — Dana Example', email: 'dana@example.com' },
];
const SUBJECTS = [
  'Demo: Algebra (sample)',
  'Demo: Spanish (sample)',
  'Demo: Physics (sample)',
  'Demo: Guitar (sample)',
];
const SERVICES = ['Online Classes', 'In-Person'];

// A UTC slot `offsetDays` from today (negative = past) at `hour`:00, `durHours` long.
function slot(nowMs, offsetDays, hour, durHours) {
  const base = new Date(nowMs);
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + offsetDays, hour, 0, 0)
  );
  return { startUTC: d.toISOString(), endUTC: new Date(d.getTime() + durHours * HOUR).toISOString() };
}

/**
 * Returns FAKE demo task records (raw event shape) — illustrative ONLY. Never
 * import into a live data path; the hook routes these only when source==='demo'
 * or as the live-failure fallback.
 * @param {number} [nowMs=Date.now()]
 */
export function generateDemoTaskEvents(nowMs = Date.now()) {
  const out = [];
  let seq = 0;
  const id = () => `demo-bk-${String(++seq).padStart(3, '0')}`;
  const student = (i) => STUDENTS[i % STUDENTS.length];
  const tutor = (i) => TUTORS[i % TUTORS.length];
  const subj = (i) => SUBJECTS[i % SUBJECTS.length];
  const svc = (i) => SERVICES[i % SERVICES.length];

  // Common defaults for one demo raw record. `role` decides which counterparty
  // field carries the (display) name — matches normalizeEvent's mapping.
  const mk = (i, off, hour, dur, type, role, extra = {}) => {
    const cp = role === 'T' ? student(i) : tutor(i);
    const s = slot(nowMs, off, hour, dur);
    const rate = [20, 25, 30, 35, 40][i % 5];
    return {
      id: id(),
      isDemo: true,
      __demo: true,
      type,
      role,
      ...s,
      ...(role === 'T' ? { student: cp.name } : { teacher: cp.name }),
      counterpartyEmail: cp.email,
      subject: subj(i),
      service: svc(i),
      referred: i % 3 === 0,
      amount: rate * dur,
      rate,
      oldRate: i % 4 === 0 ? `${rate - 5} $ for 1 Hr. (old)` : '',
      deposited: i % 2 === 0,
      ...extra,
    };
  };

  // ── Upcoming Booked — Teacher (T) — several distinct students ──────────────
  out.push(mk(0, 2, 10, 1, 'booked', 'T', { status: 'confirmed' }));
  out.push(mk(1, 3, 14, 1.5, 'booked', 'T', { status: 'confirmed' }));
  out.push(mk(2, 5, 9, 1, 'booked', 'T', { status: 'confirmed' }));
  // ── Upcoming Booked — Student (S) ──────────────────────────────────────────
  out.push(mk(3, 4, 16, 1, 'booked', 'S', { status: 'confirmed' }));
  out.push(mk(1, 6, 11, 2, 'booked', 'S', { status: 'confirmed' }));

  // ── Waiting For Confirmation (pending) — both roles ────────────────────────
  out.push(mk(2, 1, 13, 1, 'waiting', 'T', { status: 'pending', requestKind: 'booking-request' }));
  out.push(mk(3, 1, 15, 1, 'waiting', 'T', { status: 'pending', requestKind: 'booking-request' }));
  out.push(mk(0, 2, 18, 1, 'waiting', 'S', { status: 'pending', requestKind: 'booking-request' }));

  // ── Reschedule-pending (to test Accept/Decline) ────────────────────────────
  out.push(
    mk(4, 3, 12, 1, 'booked', 'T', {
      status: 'confirmed',
      reschedule: true,
      requestKind: 'reschedule',
      proposedStartUTC: slot(nowMs, 7, 12, 1).startUTC,
      proposedBy: 'teacher',
    })
  );
  out.push(
    mk(0, 4, 17, 1, 'booked', 'S', {
      status: 'confirmed',
      reschedule: true,
      requestKind: 'reschedule',
      proposedStartUTC: slot(nowMs, 8, 17, 1).startUTC,
      proposedBy: 'student',
    })
  );

  // ── Completed (past) — Teacher + Student ───────────────────────────────────
  out.push(mk(0, -3, 9, 1, 'completed', 'T', { status: 'completed' }));
  out.push(mk(1, -5, 11, 1.5, 'completed', 'T', { status: 'completed' }));
  out.push(mk(2, -7, 14, 1, 'completed', 'T', { status: 'completed' }));
  out.push(mk(3, -4, 16, 1, 'completed', 'S', { status: 'completed' }));
  out.push(mk(4, -9, 10, 2, 'completed', 'S', { status: 'completed' }));

  // ── Precedence edge: COMPLETED that also has a reschedule record -> Done ────
  out.push(
    mk(1, -2, 13, 1, 'completed', 'T', {
      status: 'completed',
      reschedule: true,
      requestKind: 'reschedule',
      proposedStartUTC: slot(nowMs, 1, 13, 1).startUTC,
      proposedBy: 'teacher',
    })
  );

  // ── Cancelled (past) — incl. a refunded one ────────────────────────────────
  out.push(
    mk(2, -6, 12, 1, 'cancelled', 'T', {
      status: 'cancelled',
      cancellationOutcome: 'fee',
      cancellationFee: 12,
      moneyState: 'fee-charged',
    })
  );
  out.push(
    mk(3, -8, 15, 1, 'cancelled', 'S', {
      status: 'cancelled',
      cancellationOutcome: 'refund',
      moneyState: 'refunded',
    })
  );

  // ── Availability (T) — upcoming open slot (shown if the table lists it) ─────
  out.push(mk(0, 6, 8, 2, 'availability', 'T', { status: 'open' }));

  // ── Optional-fields-EMPTY rows (to test toggleable columns + "—") ──────────
  out.push(
    mk(4, 7, 10, 1, 'booked', 'T', {
      status: 'confirmed',
      service: '',
      referred: false,
      oldRate: '',
      deposited: false,
    })
  );
  out.push(
    mk(2, -10, 9, 1, 'completed', 'S', {
      status: 'completed',
      service: '',
      referred: false,
      oldRate: '',
      deposited: false,
    })
  );

  // ── A few more spread across days/students so the pager (~20/page) trips ────
  out.push(mk(1, 9, 11, 1, 'booked', 'T', { status: 'confirmed' }));
  out.push(mk(2, 10, 13, 1.5, 'booked', 'T', { status: 'confirmed' }));
  out.push(mk(3, 12, 15, 1, 'booked', 'S', { status: 'confirmed' }));
  out.push(mk(4, -12, 16, 1, 'completed', 'T', { status: 'completed' }));
  out.push(mk(0, -14, 10, 1, 'completed', 'S', { status: 'completed' }));

  return out;
}
