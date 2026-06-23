// Client helpers for Google Calendar sync. Talks to the /api/google functions
// using the current Supabase session token. Never touches Google directly and
// never reads any server-only table. See docs/google-calendar-sync-v1.md.

import { supabase } from '@/api/supabaseClient';

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : null;
}

// Begin the Google consent flow (redirects the browser). role: 'teacher'|'student'.
export async function connectGoogleCalendar(role = 'teacher') {
  const headers = await authHeader();
  if (!headers) {
    throw new Error('Please sign in with your Google account first (top-right Login), then click to connect your calendar.');
  }
  const res = await fetch(`/api/google/oauth-start?role=${encodeURIComponent(role)}`, { headers });
  if (!res.ok) {
    const why = res.status === 401 ? 'your session expired — sign in again' : `server returned HTTP ${res.status}`;
    throw new Error(`Could not start Google connection (${why}).`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data.url) throw new Error('Could not start Google connection (no redirect URL returned).');
  window.location.href = data.url;
}

// Role-agnostic connection state (works for students too — freebusy-overlaps
// reports connected only for inbound teachers, so the UI uses this instead).
export async function getGoogleConnectionStatus() {
  const headers = await authHeader();
  if (!headers) return { connected: false, inboundEnabled: false };
  const res = await fetch('/api/google/status', { headers });
  if (!res.ok) return { connected: false, inboundEnabled: false };
  return res.json();
}

export async function disconnectGoogleCalendar() {
  const headers = await authHeader();
  if (!headers) throw new Error('Not signed in');
  const res = await fetch('/api/google/disconnect', { method: 'POST', headers });
  return res.ok;
}

// Inbound: the teacher's external "Busy" intervals for the snapped window.
// Returns { connected, intervals:[{start,end}], cached, stale, reason }.
export async function fetchFreebusyOverlaps(reason = 'view-open') {
  const headers = await authHeader();
  if (!headers) return { connected: false, intervals: [] };
  const res = await fetch(`/api/google/freebusy-overlaps?reason=${encodeURIComponent(reason)}`, { headers });
  if (!res.ok) return { connected: false, intervals: [] };
  return res.json();
}

// Best-effort outbound mirror enqueue — call after a booking commit/cancel.
// Fire-and-forget: the booking is already real regardless of the mirror.
export async function syncBookingToCalendar(bookingId, op = 'create') {
  try {
    const headers = await authHeader();
    if (!headers) return;
    await fetch('/api/google/sync-booking', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ bookingId, op }),
    });
  } catch {
    /* best-effort */
  }
}

// Subscribe to dirty_at bumps on the teacher's own calendar_sync_state row (RLS
// scoped). Calls onDirty() when an external change lands. Returns an unsubscribe fn.
export function subscribeCalendarSyncState(userId, onDirty) {
  if (!userId) return () => {};
  const channel = supabase
    .channel(`calendar_sync_state:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'calendar_sync_state', filter: `user_id=eq.${userId}` },
      (payload) => {
        const next = payload?.new?.dirty_at;
        if (next) onDirty(next);
      }
    )
    .subscribe();
  return () => {
    try { supabase.removeChannel(channel); } catch { /* ignore */ }
  };
}
