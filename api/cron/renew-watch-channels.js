// GET /api/cron/renew-watch-channels  (Vercel cron, daily; CRON_SECRET)
// Watch channels expire in ≤7 days. Renew any teacher channel expiring within 24h
// (or missing one): create a fresh channel, stop the old one, update the handle.

import { randomUUID, randomBytes } from 'node:crypto';
import { admin } from '../../lib-server/supabaseAdmin.js';
import { watchChannel, stopChannel } from '../../lib-server/google.js';
import { json, error, isAuthorizedCron } from '../../lib-server/http.js';

const BATCH = 100;

export default {
  async fetch(request) {
    if (!isAuthorizedCron(request)) return error('forbidden', 403);
    const a = admin();
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // inbound teachers whose channel is missing or expiring soon
    const { data: due } = await a
      .from('google_account')
      .select('user_id, cal_id, watch_channel_id, watch_resource_id, watch_expires_at')
      .eq('inbound_enabled', true)
      .eq('status', 'active')
      .or(`watch_channel_id.is.null,watch_expires_at.lt.${soon}`)
      .limit(BATCH);

    let renewed = 0;
    for (const acct of due || []) {
      try {
        const channelId = randomUUID();
        const channelToken = randomBytes(24).toString('base64url');
        const address = `${process.env.APP_BASE_URL}/api/google/calendar-webhook`;
        const { resourceId, expiration } = await watchChannel(acct.user_id, acct.cal_id || 'primary', channelId, channelToken, address, 604800);

        await a
          .from('google_account')
          .update({
            watch_channel_id: channelId,
            watch_channel_token: channelToken,
            watch_resource_id: resourceId,
            watch_expires_at: expiration ? new Date(expiration).toISOString() : new Date(Date.now() + 604800 * 1000).toISOString(),
          })
          .eq('user_id', acct.user_id);

        // Stop the old channel AFTER the new one is live (no gap in coverage).
        if (acct.watch_channel_id) {
          try { await stopChannel(acct.user_id, acct.watch_channel_id, acct.watch_resource_id); } catch { /* ignore */ }
        }
        renewed++;
      } catch {
        // leave it for the next run; inbound still works via on-view reads
      }
    }
    return json({ renewed });
  },
};
