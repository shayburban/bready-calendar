// Synthesize ONE RRULE master from a Bready recurring series (server-only).
//
// Bready stores a recurring lesson as N per-occurrence `bookings` rows sharing
// `recurrence_id` — there is NO stored series RRULE (see docs/google-calendar-sync-v1.md
// §9.6). To mirror the series as a single Google master event we must derive an
// RRULE. We detect the realistic tutoring cadences — uniform WEEKLY or DAILY — and
// return one RRULE with COUNT. Irregular series return null: the caller then defers
// (the recurring-creation flow that would store an explicit RRULE is the §11
// follow-up; today's live path is one-off, so this is exercised only by tests).

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// occurrences: array of epoch-ms start instants (any order). Returns
//   { freq:'WEEKLY'|'DAILY', count, dtStartMs, rrule } or null if not uniform.
export function seriesToRRule(occurrences) {
  const starts = [...new Set((occurrences || []).filter((n) => Number.isFinite(n)))].sort(
    (a, b) => a - b
  );
  if (starts.length < 2) return null; // not a series

  const step = starts[1] - starts[0];
  let freq = null;
  if (step === WEEK_MS) freq = 'WEEKLY';
  else if (step === DAY_MS) freq = 'DAILY';
  else return null;

  // Every gap must equal the same step (uniform cadence) for a single master.
  for (let i = 2; i < starts.length; i++) {
    if (starts[i] - starts[i - 1] !== step) return null;
  }

  return {
    freq,
    count: starts.length,
    dtStartMs: starts[0],
    rrule: `RRULE:FREQ=${freq};COUNT=${starts.length}`,
  };
}
