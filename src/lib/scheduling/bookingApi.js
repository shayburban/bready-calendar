// Booking API seam — thin wrappers over the Supabase scheduling RPCs (0009/0010).
//
// R20: every hold/booking payload carries the slot's server-generated UTC
// instant (ISO string with Z) and NEVER a viewerTz / wall-clock string. The
// viewer's zone is display metadata only and never enters these calls.
//
// The RPCs RAISE tokens ('OFF_GRID', 'SLOT_TAKEN', 'HOLD_EXPIRED', …); we map
// them to §4 error_codes + §7 message keys for the UI.

import { supabase } from '@/api/supabaseClient';
import { mapRpcError } from '@/lib/scheduling/errorMap';

export { mapRpcError };

const callRpc = async (fn, args, tokens) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, ...mapRpcError(error, tokens) };
  return { ok: true, data };
};

// Group bookable_slots rows -> R18 public projection { start_utc, durations[] }.
export const fetchBookableSlots = async (teacherId, fromUtc, toUtc, durations) => {
  const r = await callRpc('bookable_slots', {
    p_teacher: teacherId, p_from: fromUtc, p_to: toUtc, p_durations: durations,
  });
  if (!r.ok) return r;
  // Group by the server's UTC start string (authoritative; no client Date
  // reconstruction — R24/T1). Postgres timestamptz prints a fixed, UTC-offset
  // format so lexical order == chronological order.
  const byStart = new Map();
  for (const row of r.data || []) {
    const k = row.start_utc;
    if (!byStart.has(k)) byStart.set(k, new Set());
    byStart.get(k).add(row.duration_minutes);
  }
  const slots = [...byStart.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([start_utc, d]) => ({ start_utc, durations: [...d].sort((x, y) => x - y) }));
  return { ok: true, data: slots };
};

// R20: slotStartUtc is the server UTC instant (ISO Z); no viewerTz in the payload.
export const createHold = ({ teacherId, slotStartUtc, durationMinutes, sessionId, idempotencyKey }) =>
  callRpc('create_hold', {
    p_teacher: teacherId, p_slot_start_utc: slotStartUtc, p_duration_minutes: durationMinutes,
    p_session_id: sessionId ?? null, p_student_id: null, p_idempotency_key: idempotencyKey ?? null,
  });

export const rebindHold = (holdId, studentId) =>
  callRpc('rebind_hold', { p_hold_id: holdId, p_student_id: studentId });

export const commitBooking = ({ holdId, paymentRef, amount, subject }) =>
  callRpc('commit_booking', { p_hold_id: holdId, p_payment_ref: paymentRef, p_amount: amount, p_subject: subject });

export const createReschedule = ({ bookingId, proposedStartUtc, proposedBy }) =>
  callRpc('create_reschedule', { p_booking_id: bookingId, p_proposed_start_utc: proposedStartUtc, p_proposed_by: proposedBy });

export const respondReschedule = (rescheduleId, action) =>
  callRpc('respond_reschedule', { p_reschedule_id: rescheduleId, p_action: action });
