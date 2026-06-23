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
import { syncBookingToCalendar } from '@/api/googleCalendar';

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

export const commitBooking = async ({ holdId, paymentRef, amount, subject }) => {
  invalidateSlotsCache();
  const r = await callRpc('commit_booking', { p_hold_id: holdId, p_payment_ref: paymentRef, p_amount: amount, p_subject: subject });
  // Best-effort outbound mirror (enqueues for whichever parties connected Google).
  // Fire-and-forget: the booking is already committed regardless of the mirror.
  if (r.ok && r.data?.id) syncBookingToCalendar(r.data.id, 'create');
  return r;
};

// Out-of-availability request flow (0023). A student requests ANY future time
// the teacher hasn't opened; it lands as a 'requested' (waiting) booking the
// teacher approves/rejects. student_id is derived from auth.uid() server-side.
export const requestBooking = ({ teacherId, slotStartUtc, durationMinutes, subject, amount }) => {
  invalidateSlotsCache();
  return callRpc('request_booking', {
    p_teacher: teacherId,
    p_slot_start_utc: slotStartUtc,
    p_duration_minutes: durationMinutes,
    p_subject: subject ?? 'Lesson',
    p_amount: amount ?? 0,
  });
};

// Teacher approves ('approve' → confirmed) or rejects ('reject' → declined) a
// pending request. Only the request's tutor may respond (enforced server-side).
export const respondBookingRequest = (bookingId, action) => {
  // ⚠️ DEMO/FAKE bookings (ids prefixed "demo-", see src/data/demoCalendarBookings.js)
  // never touch the DB — return a synthetic success so the card's Approve/Reject
  // flow can be exercised visually without a real row.
  if (typeof bookingId === 'string' && bookingId.startsWith('demo-')) {
    return Promise.resolve({ ok: true, data: { id: bookingId, demo: true, action } });
  }
  invalidateSlotsCache(); // an approval removes the slot from the market (R22)
  return callRpc('respond_booking_request', { p_booking_id: bookingId, p_action: action });
};

// Teacher-initiated flow (0024). A teacher books someone instead of waiting for
// a student to request. All three create a student-approves 'requested' booking.

// search_students — find a registered student to book (name / email / id).
export const searchStudents = async (query, limit = 10) => {
  const r = await callRpc('search_students', { p_query: query, p_limit: limit });
  return r.ok ? { ok: true, data: Array.isArray(r.data) ? r.data : [] } : r;
};

// request_booking_for_student — teacher requests a lesson with a KNOWN student;
// the student approves it from their calendar (requested_by='teacher').
export const requestBookingForStudent = ({ studentId, slotStartUtc, durationMinutes, subject, amount }) => {
  invalidateSlotsCache();
  return callRpc('request_booking_for_student', {
    p_student: studentId,
    p_slot_start_utc: slotStartUtc,
    p_duration_minutes: durationMinutes,
    p_subject: subject ?? 'Lesson',
    p_amount: amount ?? 0,
  });
};

// create_guest_booking_invite — teacher mints a shareable invite for a brand-new
// guest. Returns the invite row (its `token` builds the shareable link).
export const createGuestBookingInvite = ({ guestName, guestEmail, slotStartUtc, durationMinutes, subject, amount }) =>
  callRpc('create_guest_booking_invite', {
    p_guest_name: guestName ?? null,
    p_guest_email: guestEmail ?? null,
    p_slot_start_utc: slotStartUtc,
    p_duration_minutes: durationMinutes,
    p_subject: subject ?? 'Lesson',
    p_amount: amount ?? 0,
  });

// get_guest_booking_invite — PUBLIC read of an invite (for the landing page).
// The RPC returns a one-row table; unwrap to the single object (or null).
export const getGuestBookingInvite = async (token) => {
  const r = await callRpc('get_guest_booking_invite', { p_token: token });
  if (!r.ok) return r;
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  return { ok: true, data: row || null };
};

// claim_guest_booking_invite — the now-registered guest materialises the request.
export const claimGuestBookingInvite = (token) => {
  invalidateSlotsCache();
  return callRpc('claim_guest_booking_invite', { p_token: token });
};

export const createReschedule = ({ bookingId, proposedStartUtc, proposedBy }) => {
  invalidateSlotsCache();
  return callRpc('create_reschedule', { p_booking_id: bookingId, p_proposed_start_utc: proposedStartUtc, p_proposed_by: proposedBy });
};

export const respondReschedule = (rescheduleId, action) => {
  invalidateSlotsCache();
  return callRpc('respond_reschedule', { p_reschedule_id: rescheduleId, p_action: action });
};

// Stage 6a / Task Manager — the caller's lessons. bookings/reschedule_pending
// have RLS on with no policies, so this reads through the SECURITY DEFINER
// get_my_bookings RPC. As of 0016 the caller is derived from auth.uid() inside
// the function (no spoofable user id); pass { includeCancelled } to also return
// cancelled lessons (the Task Manager's Done tab). Each row carries viewer_role,
// tutor_name/student_name, server-computed duration_hours/hourly_rate, and any
// PENDING reschedule proposal.
export const fetchMyBookings = (opts = {}) =>
  callRpc('get_my_bookings', { p_include_cancelled: !!opts.includeCancelled });

// Task Manager mutations (0017/0018). cancel = set status='cancelled' (never a
// hard delete); the RPC derives the policy outcome atomically. Subject persists
// the editable reminder. Both are auth.uid()-scoped and SECURITY DEFINER.
export const cancelBooking = async (bookingId) => {
  invalidateSlotsCache(); // a cancellation frees the slot back to the market (R22)
  const r = await callRpc('cancel_booking', { p_booking_id: bookingId });
  if (r.ok) syncBookingToCalendar(bookingId, 'delete'); // best-effort mirror delete
  return r;
};

export const updateBookingSubject = (bookingId, subject) =>
  callRpc('update_booking_subject', { p_booking_id: bookingId, p_subject: subject });

// Stage 7 (R-display) — a teacher's display IANA zone for the dual-zone banner,
// via the public SECURITY DEFINER get_teacher_tz RPC (0014). Scalar RPC, so the
// value is returned directly (or null when the teacher has no settings row).
export const fetchTeacherTz = async (teacherId) => {
  const r = await callRpc('get_teacher_tz', { p_teacher_id: teacherId });
  return r.ok ? { ok: true, data: r.data || null } : r;
};
