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
import { now } from '@/lib/scheduling/timekit';

export { mapRpcError };

const callRpc = async (fn, args, tokens) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, ...mapRpcError(error, tokens) };
  return { ok: true, data };
};

// R22 — public availability is cacheable for 30–60s, invalidated by any
// bookability write (hold / commit / reschedule). Small client-side TTL cache so
// navigating back to a teacher doesn't re-hit the RPC each time. now() is the
// sanctioned clock (TimeKit); raw Date.now() is banned in this module by T1.
const SLOTS_TTL_MS = 45000;
const slotsCache = new Map(); // key -> { at, data }
export const invalidateSlotsCache = () => slotsCache.clear();

// Group bookable_slots rows -> R18 public projection { start_utc, durations[] }.
export const fetchBookableSlots = async (teacherId, fromUtc, toUtc, durations) => {
  const key = `${teacherId}|${fromUtc}|${toUtc}|${(durations || []).join(',')}`;
  const hit = slotsCache.get(key);
  if (hit && now() - hit.at < SLOTS_TTL_MS) return { ok: true, data: hit.data };
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
  slotsCache.set(key, { at: now(), data: slots });
  return { ok: true, data: slots };
};

// R20: slotStartUtc is the server UTC instant (ISO Z); no viewerTz in the payload.
export const createHold = ({ teacherId, slotStartUtc, durationMinutes, sessionId, idempotencyKey }) => {
  invalidateSlotsCache(); // a hold removes a slot from the market (R22)
  return callRpc('create_hold', {
    p_teacher: teacherId, p_slot_start_utc: slotStartUtc, p_duration_minutes: durationMinutes,
    p_session_id: sessionId ?? null, p_student_id: null, p_idempotency_key: idempotencyKey ?? null,
  });
};

export const rebindHold = (holdId, studentId) =>
  callRpc('rebind_hold', { p_hold_id: holdId, p_student_id: studentId });

export const commitBooking = ({ holdId, paymentRef, amount, subject }) => {
  invalidateSlotsCache();
  return callRpc('commit_booking', { p_hold_id: holdId, p_payment_ref: paymentRef, p_amount: amount, p_subject: subject });
};

export const createReschedule = ({ bookingId, proposedStartUtc, proposedBy }) => {
  invalidateSlotsCache();
  return callRpc('create_reschedule', { p_booking_id: bookingId, p_proposed_start_utc: proposedStartUtc, p_proposed_by: proposedBy });
};

export const respondReschedule = (rescheduleId, action) => {
  invalidateSlotsCache();
  return callRpc('respond_reschedule', { p_reschedule_id: rescheduleId, p_action: action });
};

// Stage 6a — the caller's lessons. bookings/reschedule_pending have RLS on with
// no policies, so this reads through the SECURITY DEFINER get_my_bookings RPC
// (0013). Each row carries viewer_role + any PENDING reschedule proposal.
export const fetchMyBookings = (userId) =>
  callRpc('get_my_bookings', { p_user_id: userId });

// Stage 7 (R-display) — a teacher's display IANA zone for the dual-zone banner,
// via the public SECURITY DEFINER get_teacher_tz RPC (0014). Scalar RPC, so the
// value is returned directly (or null when the teacher has no settings row).
export const fetchTeacherTz = async (teacherId) => {
  const r = await callRpc('get_teacher_tz', { p_teacher_id: teacherId });
  return r.ok ? { ok: true, data: r.data || null } : r;
};
