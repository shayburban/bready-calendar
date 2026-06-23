// Signed OAuth `state` (server-only). The callback is hit by Google's browser
// redirect with NO Authorization header, so identity must travel in `state`.
// We HMAC-sign { userId, role, exp } so the callback can trust it without a session.

import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  // Reuse the token key material as the HMAC secret (already a required 32-byte env).
  const b64 = process.env.CALENDAR_TOKEN_ENC_KEY;
  if (!b64) throw new Error('CALENDAR_TOKEN_ENC_KEY is not set');
  return Buffer.from(b64, 'base64');
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signState(userId, role, ttlSeconds = 600) {
  const payload = b64url(JSON.stringify({ u: userId, r: role, e: Date.now() + ttlSeconds * 1000 }));
  const sig = b64url(createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

// Returns { userId, role } or null if invalid/expired/tampered.
export function verifyState(state) {
  if (typeof state !== 'string' || !state.includes('.')) return null;
  const [payload, sig] = state.split('.');
  const expected = b64url(createHmac('sha256', secret()).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { u, r, e } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!u || Date.now() > e) return null;
    return { userId: u, role: r };
  } catch {
    return null;
  }
}
