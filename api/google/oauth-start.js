// GET /api/google/oauth-start?role=teacher|student
// Auth: Authorization: Bearer <supabase access token>.
// Returns { url } — the Google consent URL to redirect the browser to. Requests
// minimal scopes with offline access so we receive a refresh token.

import { getUserFromToken } from '../../lib-server/supabaseAdmin.js';
import { SCOPES } from '../../lib-server/google.js';
import { signState } from '../../lib-server/oauthState.js';
import { json, error, bearerToken } from '../../lib-server/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return error('method not allowed', 405);

    const user = await getUserFromToken(bearerToken(request));
    if (!user) return error('unauthorized', 401);

    const role = new URL(request.url).searchParams.get('role') === 'student' ? 'student' : 'teacher';
    const state = signState(user.id, role);

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent', // force a refresh_token even on re-consent
      state,
    });
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  },
};
