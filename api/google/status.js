// GET /api/google/status  — role-agnostic connection state for the UI.
// Auth: Authorization: Bearer <supabase access token>. Returns { connected,
// inboundEnabled } based purely on google_account (works for students too, who
// have no inbound). Zero Google calls.

import { admin, getUserFromToken } from '../../lib-server/supabaseAdmin.js';
import { json, error, bearerToken } from '../../lib-server/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return error('method not allowed', 405);
    const user = await getUserFromToken(bearerToken(request));
    if (!user) return error('unauthorized', 401);

    const { data: account } = await admin()
      .from('google_account')
      .select('status, inbound_enabled')
      .eq('user_id', user.id)
      .single();

    return json({
      connected: !!account && account.status === 'active',
      inboundEnabled: !!account?.inbound_enabled,
    });
  },
};
