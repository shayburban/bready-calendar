// useTeacherStatsData — the ONE thing the Teacher Statistics UI consumes
// (Spec Section L). Returns the same normalized record array regardless of
// source, so switching source is a one-line change with no UI rewrite.
//
//   source: 'seed'     -> generateSeedData() (default in dev; banner + warn active)
//   source: 'mock'     -> normalize legacy sampleEvents (+ teacherTasks join seam)
//   source: 'supabase' -> normalize get_my_bookings (real instants) — Phase 6
//
// All stats/sub-components read THIS hook's output only — never the raw source.

import { useState, useEffect } from 'react';
import { sampleEvents } from './sampleEvents';
import { normalizeEvents } from './statsHelpers';
import { generateSeedData, warnDemoActive } from './statsSeedData';

// Map a Supabase get_my_bookings row -> a raw event shape normalizeEvents can
// consume. Defensive/optional mapping (Spec L) — real columns fill in when the
// RPC + finance land in production. Absent fields fall back per A#11.
function supabaseRowToRaw(row) {
  return {
    id: row.id ?? row.booking_id,
    // real UTC instants from the RPC; normalizeEvent prefers these over the
    // mock date+time derivation (Spec I — aggregate on UTC instants).
    startUTC: row.start_time,
    endUTC: row.end_time,
    type: row.type ?? row.status_bucket,
    role: row.role,
    reschedule: row.is_reschedule,
    student: row.student_id,
    teacher: row.teacher_id,
    status: row.status,
    subject: row.subject,
    service: row.service,
    referred: row.referred,
    // money/escrow/review fields straight off the RPC when present
    amount: row.amount,
    moneyState: row.money_state,
    deposited: row.deposited,
    cancellationOutcome: row.cancellation_outcome,
    cancellationFee: row.cancellation_fee,
    reviewWindowEndsUTC: row.review_window_ends,
    reviewedByStudent: row.reviewed_by_student,
    disputeOpen: row.dispute_open,
    openedAtUTC: row.opened_at,
    bookedAtUTC: row.booked_at,
  };
}

export function useTeacherStatsData({ source = 'seed' } = {}) {
  const [state, setState] = useState({ records: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        if (source === 'seed') {
          warnDemoActive(); // one-time runtime warning (Spec K)
          const records = generateSeedData();
          if (!cancelled) setState({ records, loading: false, error: null });
          return;
        }
        if (source === 'mock') {
          // Legacy sources share no join key -> money fields stay null ("—"),
          // which is the expected mock behaviour (Spec H).
          const records = normalizeEvents(sampleEvents, null);
          if (!cancelled) setState({ records, loading: false, error: null });
          return;
        }
        if (source === 'supabase') {
          // Phase 6 source swap. Lazy-import so the demo/mock paths never pull
          // the client. The RPC may return nothing yet -> friendly empty state.
          const { supabase } = await import('@/api/supabaseClient');
          const { data, error } = await supabase.rpc('get_my_bookings');
          if (error) throw error;
          const rawRows = Array.isArray(data) ? data.map(supabaseRowToRaw) : [];
          const records = normalizeEvents(rawRows, null);
          if (!cancelled) setState({ records, loading: false, error: null });
          return;
        }
        throw new Error(`Unknown stats source: ${source}`);
      } catch (err) {
        if (!cancelled) setState({ records: [], loading: false, error: err });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return state;
}
