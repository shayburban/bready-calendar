// useTeacherTasksData — the ONE source the Teacher Task Manager (page) and its
// calendar-sidebar twin both consume, so they can never disagree (Spec C/H).
//
// It produces the SAME normalized booking records the calendar + Statistics use
// (via normalizeEvents), from one of:
//   source 'supabase' (default, live)  -> get_my_bookings (both T and S in one call)
//   source 'demo'                      -> generateDemoTaskEvents (clearly-fake; Spec I)
// On a live-fetch FAILURE it falls back to the demo dataset with a distinct
// "live unavailable" mode banner — never silently passing demo off as real.
//
// Plain hook (matches the existing useTeacherStatsData convention). Realtime +
// cross-component dedupe (React Query) is deferred to Phase 3.

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { normalizeEvents } from './statsHelpers';
import { generateDemoTaskEvents } from './demoTasks';
import { hoursBetween } from './taskFormatters';
import { fetchMyBookings } from '@/lib/scheduling/bookingApi';

// Resolve the active source. Precedence: explicit prop > ?demo=1 / ?tasks=demo >
// VITE_TASKS_SOURCE env > 'supabase' (live default). Demo is NEVER the silent
// production default — it only wins via an explicit opt-in here (Spec I/M2).
export function resolveTasksSource(explicit) {
  if (explicit) return explicit;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('demo') === '1' || q.get('tasks') === 'demo') return 'demo';
  } catch {
    /* no window (SSR/tests) */
  }
  const env = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TASKS_SOURCE : undefined;
  if (env === 'demo') return 'demo';
  return 'supabase';
}

// get_my_bookings row -> raw event shape normalizeEvents understands (Spec F).
// Phase 1 reads the existing RPC (0013); Phase 2 adds tutor_name/student_name +
// duration_hours/hourly_rate, which this mapper already prefers when present.
function bookingRowToRaw(row) {
  const role = row.viewer_role === 'teacher' ? 'T' : 'S';
  const type =
    row.status === 'pending'
      ? 'waiting'
      : row.status === 'confirmed'
      ? 'booked'
      : row.status === 'completed'
      ? 'completed'
      : row.status === 'cancelled'
      ? 'cancelled'
      : row.status || 'booked';
  const counterpartyName = role === 'T' ? row.student_name : row.tutor_name;
  const counterpartyId = role === 'T' ? row.student_id : row.tutor_id;
  return {
    id: row.id,
    type,
    role,
    startUTC: row.start_time,
    endUTC: row.end_time,
    // display name preferred; falls back to id until the RPC join lands (Phase 2)
    ...(role === 'T'
      ? { student: counterpartyName || counterpartyId }
      : { teacher: counterpartyName || counterpartyId }),
    status: row.status,
    subject: row.subject,
    amount: row.amount,
    rate: row.hourly_rate ?? undefined,
    durationHoursServer: row.duration_hours ?? undefined,
    ...(row.reschedule_id
      ? {
          reschedule: true,
          requestKind: 'reschedule',
          proposedStartUTC: row.proposed_start_utc,
          proposedBy: row.proposed_by,
        }
      : {}),
    isDemo: false,
  };
}

// normalizeEvents output + the task-only extras that live alongside the record
// (kept off statsHelpers so Statistics is untouched). Order is preserved 1:1.
function enrich(raws) {
  const records = normalizeEvents(raws, null);
  return records.map((rec, i) => {
    const raw = raws[i] || {};
    return {
      ...rec,
      isDemo: raw.isDemo === true,
      hourlyRate: raw.rate ?? raw.hourlyRate ?? null,
      oldRate: raw.oldRate || '',
      counterpartyName: rec.counterpartyId, // name for demo; real name once RPC joins
      proposedStartUTC: raw.proposedStartUTC || null,
      proposedBy: raw.proposedBy || null,
      // durationHours: prefer server value, else compute from the UTC instants
      // (time math, not money) so the demo (which carries no 'time' string) is fine.
      durationHours:
        raw.durationHoursServer != null
          ? Number(raw.durationHoursServer)
          : Number.isFinite(rec.durationHours)
          ? rec.durationHours
          : hoursBetween(rec.startUTC, rec.endUTC),
    };
  });
}

export function useTeacherTasksData({ source: explicitSource } = {}) {
  const source = resolveTasksSource(explicitSource);
  const [state, setState] = useState({
    records: [],
    loading: true,
    error: null,
    mode: source === 'demo' ? 'demo' : 'live',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    const loadDemo = (mode) => {
      const records = enrich(generateDemoTaskEvents());
      if (alive) setState({ records, loading: false, error: null, mode });
    };

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      if (source === 'demo') {
        loadDemo('demo');
        return;
      }
      // Live Supabase path. On ANY failure -> demo fallback + distinct banner.
      try {
        const me = await User.me().catch(() => null);
        const r = await fetchMyBookings(me?.id);
        if (!alive) return;
        if (!r || !r.ok) throw new Error(r?.message || 'Live bookings unavailable.');
        const raws = (r.data || []).map(bookingRowToRaw);
        setState({ records: enrich(raws), loading: false, error: null, mode: 'live' });
      } catch (err) {
        if (!alive) return;
        // Fallback safety (Spec H): show demo, clearly flagged as unavailable.
        const records = enrich(generateDemoTaskEvents());
        setState({ records, loading: false, error: err, mode: 'live-unavailable' });
      }
    })();

    return () => {
      alive = false;
    };
  }, [source, reloadKey]);

  return { ...state, source, refetch };
}
