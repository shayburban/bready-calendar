// GET /api/google/freebusy-overlaps?reason=view-open|dirty-refetch
// Auth: Authorization: Bearer <supabase access token>.
//
// The ONLY inbound Google caller. Cache + dirty gated: serves freebusy_cache with
// ZERO Google calls unless the cache is stale (computed_at < dirty_at) or older
// than THROTTLE_SECONDS. Returns external-only "Busy" intervals (the teacher's own
// lessons are subtracted out — freebusy has no ids, so local subtraction is the
// only correct de-self-conflict). See docs/google-calendar-sync-v1.md §3.

import { admin, getUserFromToken } from '../../lib-server/supabaseAdmin.js';
import { freebusyQuery, TokenError } from '../../lib-server/google.js';
import { subtractIntervals } from '../../lib-server/intervals.js';
import { json, error, bearerToken } from '../../lib-server/http.js';

const THROTTLE_SECONDS = Number(process.env.FREEBUSY_THROTTLE_SECONDS || 300);
const INFLIGHT_GUARD_MS = 8000; // a sibling tab fetched this recently → serve stale

const ym = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

// Snap to fixed month boundaries: 1st of prior month → last day of next month (UTC).
function snappedWindow() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const timeMin = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const timeMax = new Date(Date.UTC(y, m + 2, 0, 23, 59, 59));
  return { timeMin, timeMax, key: `${ym(timeMin)}..${ym(timeMax)}` };
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return error('method not allowed', 405);
    const user = await getUserFromToken(bearerToken(request));
    if (!user) return error('unauthorized', 401);

    const a = admin();
    const { data: account } = await a
      .from('google_account')
      .select('status, inbound_enabled, cal_id')
      .eq('user_id', user.id)
      .single();

    if (!account || account.status !== 'active' || !account.inbound_enabled) {
      return json({ connected: false, intervals: [] });
    }

    const { timeMin, timeMax, key } = snappedWindow();
    const reason = new URL(request.url).searchParams.get('reason') || 'view-open';

    const [{ data: state }, { data: cache }] = await Promise.all([
      a.from('calendar_sync_state').select('dirty_at, last_fetched_at').eq('user_id', user.id).single(),
      a.from('freebusy_cache').select('intervals, computed_at').eq('user_id', user.id).eq('window_key', key).single(),
    ]);

    const dirtyAt = state?.dirty_at ? Date.parse(state.dirty_at) : 0;
    const computedAt = cache?.computed_at ? Date.parse(cache.computed_at) : 0;
    const lastFetched = state?.last_fetched_at ? Date.parse(state.last_fetched_at) : 0;
    const now = Date.now();

    const fresh = cache && computedAt >= dirtyAt && now - computedAt < THROTTLE_SECONDS * 1000;
    const siblingFetching = cache && now - lastFetched < INFLIGHT_GUARD_MS;
    if (fresh || siblingFetching) {
      return json({ connected: true, cached: true, intervals: cache.intervals || [] });
    }

    // Claim the in-flight guard before the (slow) Google call so sibling tabs back off.
    await a
      .from('calendar_sync_state')
      .upsert({ user_id: user.id, last_fetched_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() }, { onConflict: 'user_id' });

    let busy;
    try {
      busy = await freebusyQuery(user.id, account.cal_id || 'primary', timeMin.toISOString(), timeMax.toISOString(), reason);
    } catch (e) {
      if (e instanceof TokenError) return json({ connected: false, reason: e.code, intervals: cache?.intervals || [] });
      // Transient Google failure: serve stale cache rather than nothing.
      return json({ connected: true, cached: true, stale: true, intervals: cache?.intervals || [] }, 200);
    }

    // Subtract the teacher's OWN lessons in-window (recurring lessons are already
    // concrete per-occurrence rows) so they never self-warn.
    const { data: mine } = await a
      .from('bookings')
      .select('start_time, end_time')
      .eq('tutor_id', user.id)
      .in('status', ['confirmed', 'pending', 'completed'])
      .lt('start_time', timeMax.toISOString())
      .gt('end_time', timeMin.toISOString());

    const ownLessons = (mine || []).map((b) => ({ start: Date.parse(b.start_time), end: Date.parse(b.end_time) }));
    const external = subtractIntervals(busy, ownLessons);

    await a
      .from('freebusy_cache')
      .upsert({ user_id: user.id, window_key: key, intervals: external, computed_at: new Date().toISOString() }, { onConflict: 'user_id,window_key' });

    return json({ connected: true, cached: false, intervals: external });
  },
};
