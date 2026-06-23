// POST /api/google/sync-booking   body: { bookingId, op?: 'create'|'delete' }
// Auth: Authorization: Bearer <supabase access token> — caller must be a party to
// the booking. Enqueues outbound mirror rows (only for parties who connected
// Google). Call this right after commit_booking / cancel succeeds. Best-effort:
// the booking is already real in our DB regardless of the mirror.

import { admin, getUserFromToken } from '../../lib-server/supabaseAdmin.js';
import { enqueueForBooking } from '../../lib-server/outbox.js';
import { json, error, bearerToken, readJson } from '../../lib-server/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return error('method not allowed', 405);
    const user = await getUserFromToken(bearerToken(request));
    if (!user) return error('unauthorized', 401);

    const body = await readJson(request);
    if (!body?.bookingId) return error('bookingId required', 400);
    const op = body.op === 'delete' ? 'delete' : 'create';

    const a = admin();
    const { data: booking } = await a.from('bookings').select('id, tutor_id, student_id').eq('id', body.bookingId).single();
    if (!booking) return error('booking not found', 404);
    if (user.id !== booking.tutor_id && user.id !== booking.student_id) return error('forbidden', 403);

    const result = await enqueueForBooking(booking.id, op);
    return json({ ok: true, ...result });
  },
};
