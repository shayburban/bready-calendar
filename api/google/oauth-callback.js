// GET /api/google/oauth-callback?code=...&state=...
// Google's browser redirect lands here. Exchanges the code, stores encrypted
// tokens against the signed-state user, creates the inbound watch channel for
// teachers, then redirects back into the app.

import { randomUUID, randomBytes } from 'node:crypto';
import { admin } from '../../lib-server/supabaseAdmin.js';
import { exchangeCodeForTokens, watchChannel, SCOPES } from '../../lib-server/google.js';
import { encryptToken } from '../../lib-server/crypto.js';
import { verifyState } from '../../lib-server/oauthState.js';

function redirect(path, params = {}) {
  const base = process.env.APP_BASE_URL || '';
  const qs = new URLSearchParams(params).toString();
  return new Response(null, { status: 302, headers: { location: `${base}${path}${qs ? `?${qs}` : ''}` } });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const oauthErr = url.searchParams.get('error');
    const st = verifyState(url.searchParams.get('state'));

    if (oauthErr) return redirect('/MyProfile', { gcal: 'denied' });
    if (!code || !st) return redirect('/MyProfile', { gcal: 'error' });

    const { userId, role } = st;
    const landing = role === 'student' ? '/StudentDashboard' : '/TeacherCalendar';

    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch {
      return redirect(landing, { gcal: 'error' });
    }
    // prompt=consent should always return a refresh_token; bail if it didn't.
    if (!tokens.refresh_token) return redirect(landing, { gcal: 'error' });

    const a = admin();
    const inbound = role === 'teacher';
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    await a.from('google_account').upsert(
      {
        user_id: userId,
        role,
        cal_id: 'primary',
        refresh_token_enc: encryptToken(tokens.refresh_token),
        access_token_enc: encryptToken(tokens.access_token),
        access_token_expires_at: expiresAt,
        scopes: tokens.scope ? tokens.scope.split(' ') : SCOPES,
        status: 'active',
        inbound_enabled: inbound,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

    if (inbound) {
      // Ensure the realtime/dirty row exists and starts dirty (first read is fresh).
      await a.from('calendar_sync_state').upsert({ user_id: userId, dirty_at: now, updated_at: now }, { onConflict: 'user_id' });

      // Best-effort watch channel (the invalidation signal). Never blocks connect.
      try {
        const channelId = randomUUID();
        const channelToken = randomBytes(24).toString('base64url');
        const address = `${process.env.APP_BASE_URL}/api/google/calendar-webhook`;
        const { resourceId, expiration } = await watchChannel(userId, 'primary', channelId, channelToken, address, 604800);
        await a
          .from('google_account')
          .update({
            watch_channel_id: channelId,
            watch_channel_token: channelToken,
            watch_resource_id: resourceId,
            watch_expires_at: expiration ? new Date(expiration).toISOString() : new Date(Date.now() + 604800 * 1000).toISOString(),
          })
          .eq('user_id', userId);
      } catch {
        // Inbound still works via on-view freebusy reads even without the channel;
        // the renewal cron will retry establishing one.
      }
    }

    return redirect(landing, { gcal: 'connected' });
  },
};
