// Client helpers for the admin calendar-sync drain controls. All calls carry the
// current Supabase session token; /api/admin/drain verifies admin role server-side
// and dispatches by action. Never handles CRON_SECRET (that's server-only).

import { supabase } from '@/api/supabaseClient';

async function authHeaders(extra = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { authorization: `Bearer ${token}`, ...extra } : extra;
}

async function post(action, payload = {}) {
  const res = await fetch('/api/admin/drain', {
    method: 'POST',
    headers: await authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

export async function getDrainStatus() {
  const res = await fetch('/api/admin/drain', { headers: await authHeaders() });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

export const setTriggerMode = (mode) => post('trigger-mode', { mode });
export const setDrainEnabled = (enabled) => post('drain-enabled', { enabled });
export const runDrainNow = () => post('drain-now');
