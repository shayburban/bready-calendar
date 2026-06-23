// Service-role Supabase client for Vercel functions (server-only).
//
// Bypasses RLS — NEVER ship this key to the browser. Used to read/write
// google_account (no client policy), freebusy_cache, calendar_outbox, etc.

import { createClient } from '@supabase/supabase-js';

let _admin = null;

export function admin() {
  if (_admin) return _admin;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  _admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

// Verify the Supabase access token a browser client sent (Authorization: Bearer).
// Returns the auth user or null. This is how user-facing functions authenticate.
export async function getUserFromToken(accessToken) {
  if (!accessToken) return null;
  const { data, error } = await admin().auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}

// Admin guard for the /api/admin routes. Verifies the Supabase JWT and checks the
// admin role (app_metadata.role === 'admin' — the model the app already uses via
// the SQL is_admin() helper / handle_new_user seeding). Returns the user or null.
export async function requireAdmin(request) {
  const h = request.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) return null;
  const role = user.app_metadata?.role || user.user_metadata?.role || user.role;
  return role === 'admin' ? user : null;
}

// Append a row to the cost-audit table. Best-effort; never throws into the caller.
export async function auditCall(userId, method, path, reason, status) {
  try {
    await admin()
      .from('google_api_calls')
      .insert({ user_id: userId ?? null, method, path: path ?? null, reason: reason ?? null, status: status ?? null });
  } catch {
    /* audit is best-effort */
  }
}
