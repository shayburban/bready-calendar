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
// Phase 2: also exposes mutators (cancel / subject / reschedule propose / accept-
// decline). In LIVE mode they call the SECURITY DEFINER RPCs then refetch; in
// DEMO mode they mutate the local demo records ONLY (never the backend, Spec I).
//
// Plain hook (matches useTeacherStatsData). Realtime + optimistic/rollback +
// cross-component dedupe (React Query) is deferred to Phase 3.

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/api/entities';
import { normalizeEvents } from './statsHelpers';
import { generateDemoTaskEvents } from './demoTasks';
import { hoursBetween } from './taskFormatters';
import {
  fetchMyBookings,
  cancelBooking,
  updateBookingSubject,
  createReschedule,
  respondReschedule,
} from '@/lib/scheduling/bookingApi';

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
// As of 0016 the RPC also returns tutor_name/student_name + duration_hours/
// hourly_rate, which this mapper prefers when present.
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
          rescheduleId: row.reschedule_id,
          proposedStartUTC: row.proposed_start_utc,
          proposedBy: row.proposed_by,
        }
      : {}),
    isDemo: false,
  };
}

function enrich(raws) {
  const records = normalizeEvents(raws, null);
  return records.map((rec, i) => {
    const raw = raws[i] || {};
    return {
      ...rec,
      isDemo: raw.isDemo === true,
      hourlyRate: raw.rate ?? raw.hourlyRate ?? null,
      oldRate: raw.oldRate || '',
      counterpartyName: rec.counterpartyId,
      rescheduleId: raw.rescheduleId || null,
      proposedStartUTC: raw.proposedStartUTC || null,
      proposedBy: raw.proposedBy || null,
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
    lastUpdated: null,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    const loadDemo = (mode) => {
      const records = enrich(generateDemoTaskEvents());
      if (alive) setState({ records, loading: false, error: null, mode, lastUpdated: Date.now() });
    };

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      if (source === 'demo') {
        loadDemo('demo');
        return;
      }
      try {
        await User.me().catch(() => null); // ensure a session is attempted
        const r = await fetchMyBookings({ includeCancelled: true });
        if (!alive) return;
        if (!r || !r.ok) throw new Error(r?.message || 'Live bookings unavailable.');
        const raws = (r.data || []).map(bookingRowToRaw);
        setState({ records: enrich(raws), loading: false, error: null, mode: 'live', lastUpdated: Date.now() });
      } catch (err) {
        if (!alive) return;
        const records = enrich(generateDemoTaskEvents());
        setState({ records, loading: false, error: err, mode: 'live-unavailable', lastUpdated: Date.now() });
      }
    })();

    return () => {
      alive = false;
    };
  }, [source, reloadKey]);

  // Demo data is active whenever the rows are demo (explicit demo OR fallback).
  const isDemoActive = state.mode === 'demo' || state.mode === 'live-unavailable';

  // Patch one local record by id. In demo this IS the mutation; in live it is the
  // optimistic step (reconciled by refetch, or reverted on failure).
  const patchLocal = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  // Always-current records snapshot for optimistic rollback (Spec H).
  const recordsRef = useRef([]);
  useEffect(() => {
    recordsRef.current = state.records;
  }, [state.records]);

  // Live mutation: apply `patch` optimistically, call the RPC, then reconcile via
  // refetch on success or ROLL BACK to the pre-mutation snapshot on failure.
  const liveOptimistic = useCallback(
    async (id, patch, rpcCall) => {
      const snapshot = recordsRef.current;
      patchLocal(id, patch);
      const r = await rpcCall();
      if (r.ok) refetch();
      else setState((s) => ({ ...s, records: snapshot }));
      return r;
    },
    [patchLocal, refetch]
  );

  const cancelTask = useCallback(
    async (id) => {
      if (isDemoActive) {
        patchLocal(id, {
          type: 'cancelled',
          status: 'cancelled',
          moneyState: 'refunded',
          cancellationOutcome: 'refund',
          isReschedule: false,
          rescheduleId: null,
          proposedStartUTC: null,
          proposedBy: null,
        });
        return { ok: true, demo: true };
      }
      return liveOptimistic(
        id,
        { type: 'cancelled', status: 'cancelled', isReschedule: false, rescheduleId: null, proposedStartUTC: null, proposedBy: null },
        () => cancelBooking(id)
      );
    },
    [isDemoActive, patchLocal, liveOptimistic]
  );

  const updateSubject = useCallback(
    async (id, subject) => {
      if (isDemoActive) {
        patchLocal(id, { subject });
        return { ok: true, demo: true };
      }
      return liveOptimistic(id, { subject }, () => updateBookingSubject(id, subject));
    },
    [isDemoActive, patchLocal, liveOptimistic]
  );

  const proposeReschedule = useCallback(
    async (id, proposedStartUtc, proposedBy) => {
      const patch = {
        isReschedule: true,
        requestKind: 'reschedule',
        proposedStartUTC: proposedStartUtc,
        proposedBy,
        rescheduleId: isDemoActive ? `demo-rp-${id}` : null,
      };
      if (isDemoActive) {
        patchLocal(id, patch);
        return { ok: true, demo: true };
      }
      return liveOptimistic(id, patch, () => createReschedule({ bookingId: id, proposedStartUtc, proposedBy }));
    },
    [isDemoActive, patchLocal, liveOptimistic]
  );

  const answerReschedule = useCallback(
    async (row, action) => {
      let patch;
      if (action === 'accept' && row.rescheduleProposedUTC) {
        const start = row.record?.startUTC ? new Date(row.record.startUTC).getTime() : null;
        const end = row.record?.endUTC ? new Date(row.record.endUTC).getTime() : null;
        const durMs = start != null && end != null ? end - start : 60 * 60 * 1000;
        const newStart = row.rescheduleProposedUTC;
        const newEnd = new Date(new Date(newStart).getTime() + durMs).toISOString();
        patch = {
          startUTC: newStart,
          endUTC: newEnd,
          isReschedule: false,
          rescheduleId: null,
          proposedStartUTC: null,
          proposedBy: null,
        };
      } else {
        patch = { isReschedule: false, rescheduleId: null, proposedStartUTC: null, proposedBy: null };
      }
      if (isDemoActive) {
        patchLocal(row.id, patch);
        return { ok: true, demo: true };
      }
      return liveOptimistic(row.id, patch, () => respondReschedule(row.rescheduleId, action));
    },
    [isDemoActive, patchLocal, liveOptimistic]
  );

  return {
    ...state,
    source,
    isDemoActive,
    refetch,
    cancelTask,
    updateSubject,
    proposeReschedule,
    answerReschedule,
  };
}
