// Offer generation (spec R2) + the public slots-only projection (R18).
//
// Pure: consumes EffectiveBookable + TimeKit's grid. Flag-gating lives at the
// call site (offers are only generated when SCHEDULING_RULES is on; §1.3).

import { gridCandidates, GRID_MS } from '@/lib/scheduling/timekit';
import { evaluateStart, mergeIntervals } from '@/lib/scheduling/effectiveBookable';

const MIN_MS = 60 * 1000;

// generateOffers — per offered duration, every 15-min grid start whose lesson
// fits inside open availability, clears all physical/break/corridor constraints
// (R1–R4, R11–R13). Returns { offersByDuration: { [minutes]: [start_utc,...] },
// flat: [{ start_utc, duration_minutes }] }.
//
// params:
//   availability : [{ start, end }] open intervals (one-off + materialized
//                  recurrence already merged into ms intervals)
//   blockers     : [{ type:'booked'|'hold'|'reschedule_pending'|'cancelled',
//                     start_utc, end_utc, status? }]
//   breakMinutes : B (minutes); 0 when unset
//   corridor     : { nearEdge, farEdge } (R4); farEdge may be Infinity
//   durations    : number[] offered lesson lengths in MINUTES
//   from, to     : finite UtcInstant query window (the visible range). The
//                  START is additionally capped to corridor; the END may exceed
//                  `to`/farEdge, but starts are only enumerated within [from,to].
export const generateOffers = ({
  availability = [],
  blockers = [],
  breakMinutes = 0,
  corridor = null,
  durations = [],
  from,
  to,
}) => {
  const mergedAvail = mergeIntervals(
    availability.map((iv) => ({ start: iv.start ?? iv.start_utc, end: iv.end ?? iv.end_utc }))
  );
  const breakMs = breakMinutes * MIN_MS;

  // Cap the START search window to [from, min(to, farEdge)] (start must be
  // <= farEdge; end may pass it). nearEdge is enforced per-candidate by
  // evaluateStart, but we also lift `from` to nearEdge to skip dead candidates.
  const nearEdge = corridor ? corridor.nearEdge : from;
  const farEdge = corridor ? corridor.farEdge : to;
  const startFrom = Math.max(from, nearEdge);
  const startTo = Math.min(to, Number.isFinite(farEdge) ? farEdge : to);

  const offersByDuration = {};
  const flat = [];
  if (startTo < startFrom) return { offersByDuration, flat };

  const candidates = gridCandidates(startFrom, startTo);
  const ctx = { availability: mergedAvail, blockers, breakMs, corridor };

  for (const d of durations) {
    const durMs = d * MIN_MS;
    const starts = [];
    for (const s of candidates) {
      if (evaluateStart(s, durMs, ctx).ok) {
        starts.push(s);
        flat.push({ start_utc: s, duration_minutes: d });
      }
    }
    offersByDuration[d] = starts;
  }
  return { offersByDuration, flat };
};

// publicSlots — R18 projection: ONLY { start_utc, durations[] } per slot, no
// states/reasons/names/synced/viewerTz. Groups offered durations by start,
// sorted ascending by start_utc.
export const publicSlots = (offersByDuration) => {
  const byStart = new Map();
  for (const [d, starts] of Object.entries(offersByDuration)) {
    const dur = Number(d);
    for (const s of starts) {
      if (!byStart.has(s)) byStart.set(s, new Set());
      byStart.get(s).add(dur);
    }
  }
  return [...byStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([start_utc, durs]) => ({
      start_utc,
      durations: [...durs].sort((a, b) => a - b),
    }));
};

export { GRID_MS };
