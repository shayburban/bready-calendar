// Google OAuth + Calendar REST wrappers (server-only).
//
// Minimal scopes (docs/google-calendar-sync-v1.md §6): calendar.events (outbound
// write) + calendar.freebusy (busy-only inbound). Token refresh hits the OAuth
// endpoint (NOT the Calendar API) so it never counts against the daily threshold.
// Every real Calendar API call is audited for cost observability.

import { admin, auditCall } from './supabaseAdmin.js';
import { encryptToken, decryptToken } from './crypto.js';

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const CAL_BASE = 'https://www.googleapis.com/calendar/v3';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

const SKEW_MS = 60 * 1000; // treat a token as expired 60s early

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

// --- OAuth ----------------------------------------------------------------

// Exchange an authorization code for tokens (offline → includes refresh_token).
export async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    code,
    client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
    client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirect_uri: env('GOOGLE_OAUTH_REDIRECT_URI'),
    grant_type: 'authorization_code',
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token exchange failed: ${data.error || res.status}`);
  return data; // { access_token, refresh_token, expires_in, scope, token_type }
}

export async function revokeToken(token) {
  try {
    await fetch(`${OAUTH_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' });
  } catch {
    /* best-effort */
  }
}

// --- Token lifecycle ------------------------------------------------------

class TokenError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}
export { TokenError };

async function refreshNow(account) {
  const refreshToken = decryptToken(account.refresh_token_enc);
  if (!refreshToken) throw new TokenError('NOT_CONNECTED', 'no refresh token');

  const body = new URLSearchParams({
    client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
    client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // invalid_grant = user revoked / token dead → trip the circuit breaker.
    if (data.error === 'invalid_grant') {
      await markUnauthorized(account.user_id);
      throw new TokenError('UNAUTHORIZED', 'refresh token invalid');
    }
    throw new TokenError('REFRESH_FAILED', data.error || `status ${res.status}`);
  }

  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString();
  await admin()
    .from('google_account')
    .update({
      access_token_enc: encryptToken(data.access_token),
      access_token_expires_at: expiresAt,
      token_refresh_lease: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', account.user_id);
  return data.access_token;
}

// Circuit breaker: stop burning compute on a dead token.
export async function markUnauthorized(userId) {
  const a = admin();
  await a
    .from('google_account')
    .update({ status: 'unauthorized', watch_channel_id: null, watch_resource_id: null, watch_expires_at: null, token_refresh_lease: null })
    .eq('user_id', userId);
  await a
    .from('calendar_outbox')
    .update({ status: 'failed_permanent', last_error: 'account unauthorized' })
    .eq('user_id', userId)
    .eq('status', 'pending');
}

// The shared accessor: returns a valid access token, refreshing under a short
// single-flight lease if needed. Throws TokenError('NOT_CONNECTED'|'UNAUTHORIZED').
export async function getValidAccessToken(userId) {
  const a = admin();
  const { data: account } = await a.from('google_account').select('*').eq('user_id', userId).single();
  if (!account) throw new TokenError('NOT_CONNECTED', 'no google_account');
  if (account.status === 'unauthorized') throw new TokenError('UNAUTHORIZED', 'account unauthorized');

  const exp = account.access_token_expires_at ? Date.parse(account.access_token_expires_at) : 0;
  if (account.access_token_enc && exp > Date.now() + SKEW_MS) {
    return decryptToken(account.access_token_enc);
  }

  // Claim a refresh lease (single-flight). Only one caller's UPDATE matches.
  const leaseUntil = new Date(Date.now() + 20 * 1000).toISOString();
  const { data: claimed } = await a
    .from('google_account')
    .update({ token_refresh_lease: leaseUntil })
    .eq('user_id', userId)
    .or(`token_refresh_lease.is.null,token_refresh_lease.lt.${new Date().toISOString()}`)
    .select('user_id');

  if (claimed && claimed.length > 0) {
    return refreshNow(account);
  }

  // Someone else is refreshing — wait briefly, then re-read the fresh token.
  await new Promise((r) => setTimeout(r, 1500));
  const { data: again } = await a.from('google_account').select('*').eq('user_id', userId).single();
  const exp2 = again?.access_token_expires_at ? Date.parse(again.access_token_expires_at) : 0;
  if (again?.access_token_enc && exp2 > Date.now() + SKEW_MS) {
    return decryptToken(again.access_token_enc);
  }
  // Lease holder stalled — refresh ourselves (lease has its own 20s expiry).
  return refreshNow(again || account);
}

// --- Calendar REST --------------------------------------------------------

async function gfetch(userId, method, url, { token, body, reason } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // audit path = the API surface, not the full URL (no ids/secrets in audit)
  const apiPath = url.replace(CAL_BASE, '').split('?')[0];
  await auditCall(userId, `${method} ${apiPath.split('/').slice(0, 3).join('/')}`, apiPath, reason, res.status);
  return res;
}

// freebusy.query — busy intervals only (no event content/ids). Returns
// [{ start, end }] epoch-ms for the primary calendar.
export async function freebusyQuery(userId, calId, timeMinIso, timeMaxIso, reason) {
  const token = await getValidAccessToken(userId);
  const res = await gfetch(userId, 'POST', `${CAL_BASE}/freeBusy`, {
    token,
    reason,
    body: { timeMin: timeMinIso, timeMax: timeMaxIso, items: [{ id: calId || 'primary' }] },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`freebusy failed: ${data.error?.message || res.status}`);
  const cal = data.calendars?.[calId || 'primary'];
  if (cal?.errors?.length) throw new Error(`freebusy calendar error: ${cal.errors[0].reason}`);
  return (cal?.busy || []).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

// events.watch — create a push channel (invalidation signal only).
export async function watchChannel(userId, calId, channelId, channelToken, address, ttlSeconds) {
  const token = await getValidAccessToken(userId);
  const res = await gfetch(userId, 'POST', `${CAL_BASE}/calendars/${encodeURIComponent(calId || 'primary')}/events/watch`, {
    token,
    reason: 'watch',
    body: { id: channelId, type: 'web_hook', address, token: channelToken, params: { ttl: String(ttlSeconds || 604800) } },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`watch failed: ${data.error?.message || res.status}`);
  return { resourceId: data.resourceId, expiration: data.expiration ? Number(data.expiration) : null };
}

export async function stopChannel(userId, channelId, resourceId) {
  if (!channelId || !resourceId) return;
  const token = await getValidAccessToken(userId);
  await gfetch(userId, 'POST', `${CAL_BASE}/channels/stop`, {
    token,
    reason: 'stop-channel',
    body: { id: channelId, resourceId },
  });
}

// events.insert / patch / delete — outbound mirror. Idempotent outcomes handled
// by the caller (the outbox worker).
export async function eventsInsert(userId, calId, event, reason) {
  const token = await getValidAccessToken(userId);
  const res = await gfetch(userId, 'POST', `${CAL_BASE}/calendars/${encodeURIComponent(calId || 'primary')}/events`, {
    token,
    reason,
    body: event,
  });
  return res; // caller inspects status (200/409=done)
}

export async function eventsPatch(userId, calId, eventId, patch, reason) {
  const token = await getValidAccessToken(userId);
  return gfetch(userId, 'PATCH', `${CAL_BASE}/calendars/${encodeURIComponent(calId || 'primary')}/events/${encodeURIComponent(eventId)}`, {
    token,
    reason,
    body: patch,
  });
}

export async function eventsDelete(userId, calId, eventId, reason) {
  const token = await getValidAccessToken(userId);
  return gfetch(userId, 'DELETE', `${CAL_BASE}/calendars/${encodeURIComponent(calId || 'primary')}/events/${encodeURIComponent(eventId)}`, {
    token,
    reason,
  });
}
