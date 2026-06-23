// POST /api/google/calendar-webhook
// Google push receiver. INVALIDATION SIGNAL ONLY — it flips calendar_sync_state
// .dirty_at and returns 200 in <2s. It NEVER calls Google. A burst of N external
// edits = N cheap dirty bumps, coalesced into at most one later freebusy read.

import { admin } from '../../lib-server/supabaseAdmin.js';

export default {
  async fetch(request) {
    // Always 200 fast: a non-2xx makes Google retry aggressively (thundering herd).
    const ok = () => new Response(null, { status: 200 });

    const channelId = request.headers.get('x-goog-channel-id');
    const channelToken = request.headers.get('x-goog-channel-token');
    const resourceState = request.headers.get('x-goog-resource-state');

    // The initial handshake carries no change — acknowledge and ignore.
    if (resourceState === 'sync') return ok();
    if (!channelId) return ok();

    try {
      const a = admin();
      const { data: account } = await a
        .from('google_account')
        .select('user_id, watch_channel_token')
        .eq('watch_channel_id', channelId)
        .single();

      // Unknown channel or bad token → drop silently (no work, still 200).
      if (!account || account.watch_channel_token !== channelToken) return ok();

      await a
        .from('calendar_sync_state')
        .upsert({ user_id: account.user_id, dirty_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch {
      // Even on error we ack — lazy on-view read will recover the state.
    }
    return ok();
  },
};
