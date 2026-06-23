// Outbound mirror: enqueue + build Google event bodies (server-only).
//
// One row per (booking, target user, op). A booking fans out to the teacher's and
// the student's calendars — but ONLY to parties who have a connected, active
// google_account. Deterministic ids make the worker idempotent. Recurring series
// are mirrored as ONE RRULE master keyed by recurrence_id; one-off bookings as a
// single timed event. See docs/google-calendar-sync-v1.md §4.

import { admin } from './supabaseAdmin.js';
import { masterEventId } from './ids.js';
import { seriesToRRule } from './rrule.js';

const BACKOFF_JITTER_MS = () => 5000 + Math.floor((Date.now() % 10) * 1000); // 5–15s, deterministic-free

// Which connected parties should a booking mirror to?
async function connectedTargets(booking) {
  const a = admin();
  const ids = [
    { userId: booking.tutor_id, role: 'teacher' },
    { userId: booking.student_id, role: 'student' },
  ].filter((t) => t.userId);
  const { data: accounts } = await a
    .from('google_account')
    .select('user_id, status')
    .in('user_id', ids.map((t) => t.userId));
  const active = new Set((accounts || []).filter((x) => x.status === 'active').map((x) => x.user_id));
  return ids.filter((t) => active.has(t.userId));
}

// Enqueue mirror rows for a booking. op: 'create' (commit) | 'delete' (cancel).
// Idempotent-ish: skips a (google_event_id,user_id) that already has a live row.
export async function enqueueForBooking(bookingId, op = 'create') {
  const a = admin();
  const { data: booking } = await a.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return { enqueued: 0 };

  const targets = await connectedTargets(booking);
  if (targets.length === 0) return { enqueued: 0 };

  const isSeries = !!booking.recurrence_id;
  const seriesKey = booking.recurrence_id || booking.id;
  let enqueued = 0;

  for (const t of targets) {
    const googleEventId = masterEventId(seriesKey, t.role);

    // A series mirrors as a single master: only the first occurrence enqueues the
    // create; a per-occurrence cancel/edit becomes an instance op.
    const scope = isSeries && op !== 'create' ? 'instance' : 'event';
    const row = {
      booking_id: booking.id,
      user_id: t.userId,
      google_event_id: googleEventId,
      op,
      scope,
      instance_original_start: scope === 'instance' ? booking.start_time : null,
      status: 'pending',
      next_attempt_at: new Date().toISOString(),
    };

    // For a series CREATE, dedupe so we don't enqueue N master-creates.
    if (op === 'create' && isSeries) {
      const { data: existing } = await a
        .from('calendar_outbox')
        .select('id')
        .eq('user_id', t.userId)
        .eq('google_event_id', googleEventId)
        .in('status', ['pending', 'processing', 'done'])
        .limit(1);
      if (existing && existing.length) continue;
    }

    await a.from('calendar_outbox').insert(row);
    enqueued++;
  }
  return { enqueued };
}

// Build the Google events.insert body for a CREATE row. For a series, loads all
// sibling occurrences and synthesizes one RRULE. Returns { body } or
// { error } when the series cadence is irregular (the §11 follow-up).
export async function buildCreateBody(row, booking) {
  const summary = `Bready: ${booking.subject || 'Lesson'}`;
  const base = {
    id: row.google_event_id,
    summary,
    start: { dateTime: new Date(booking.start_time).toISOString() },
    end: { dateTime: new Date(booking.end_time).toISOString() },
    extendedProperties: { private: { source: 'bready', bookingId: booking.id, ...(booking.recurrence_id ? { recurrenceId: booking.recurrence_id } : {}) } },
  };

  if (!booking.recurrence_id) return { body: base };

  const a = admin();
  const { data: siblings } = await a
    .from('bookings')
    .select('start_time')
    .eq('recurrence_id', booking.recurrence_id)
    .eq('tutor_id', booking.tutor_id);
  const starts = (siblings || []).map((s) => Date.parse(s.start_time));
  const rr = seriesToRRule(starts);
  if (!rr) return { error: 'irregular-series-needs-rrule' };

  // Master starts at the FIRST occurrence; RRULE carries the cadence + count.
  return {
    body: {
      ...base,
      start: { dateTime: new Date(rr.dtStartMs).toISOString() },
      end: { dateTime: new Date(rr.dtStartMs + (Date.parse(booking.end_time) - Date.parse(booking.start_time))).toISOString() },
      recurrence: [rr.rrule],
    },
  };
}

export const backoffMs = (attempts) => Math.min(60_000 * 2 ** attempts, 60 * 60_000) + BACKOFF_JITTER_MS();
