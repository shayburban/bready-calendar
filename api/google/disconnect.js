// POST /api/google/disconnect
// Auth: Authorization: Bearer <supabase access token>.
// Stops the watch channel, revokes on Google, deletes all local sync state, and
// abandons pending outbox rows. Lessons keep working without the Google mirror.

import { admin, getUserFromToken } from '../../lib-server/supabaseAdmin.js';
import { stopChannel, revokeToken } from '../../lib-server/google.js';
import { decryptToken } from '../../lib-server/crypto.js';
import { json, error, bearerToken } from '../../lib-server/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return error('method not allowed', 405);
    const user = await getUserFromToken(bearerToken(request));
    if (!user) return error('unauthorized', 401);

    const a = admin();
    const { data: account } = await a.from('google_account').select('*').eq('user_id', user.id).single();

    if (account) {
      // Best-effort stop channel (needs a live token; skip if unauthorized).
      if (account.status === 'active' && account.watch_channel_id) {
        try {
          await stopChannel(user.id, account.watch_channel_id, account.watch_resource_id);
        } catch { /* ignore */ }
      }
      // Best-effort revoke so the grant disappears from the user's Google account.
      try {
        const rt = decryptToken(account.refresh_token_enc);
        if (rt) await revokeToken(rt);
      } catch { /* ignore */ }
    }

    await a.from('calendar_outbox').update({ status: 'abandoned', last_error: 'disconnected' }).eq('user_id', user.id).eq('status', 'pending');
    await a.from('freebusy_cache').delete().eq('user_id', user.id);
    await a.from('calendar_sync_state').delete().eq('user_id', user.id);
    await a.from('google_account').delete().eq('user_id', user.id);

    return json({ disconnected: true });
  },
};
