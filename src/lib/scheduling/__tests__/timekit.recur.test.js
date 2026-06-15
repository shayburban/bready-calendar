import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { materializeOccurrences } from '@/lib/scheduling/timekit';

// T-recur — a "Monday 16:00 America/New_York" weekly series keeps 16:00 LOCAL
// across the spring/autumn weeks, even though the absolute UTC instant shifts by
// an hour when NY changes offset. Proves recurrence is a local anchor, not a
// fixed UTC instant (R25).
describe('T-recur — cross-DST weekly series keeps its local wall-clock (R25)', () => {
  const rec = {
    anchor_iana_tz: 'America/New_York',
    local_wallclock_start: '16:00',
    duration_minutes: 60,
    rrule: 'FREQ=WEEKLY;BYDAY=MO',
    range_start_date: '2026-02-23', // a Monday before spring-forward (Mar 8)
    range_end_date: '2026-04-06', // a Monday after
  };

  it('every materialized Monday is 16:00 local NY, spanning the DST change', () => {
    const from = DateTime.fromISO('2026-02-23T00:00:00Z').toMillis();
    const to = DateTime.fromISO('2026-04-07T00:00:00Z').toMillis();
    const occ = materializeOccurrences(rec, from, to);

    // Mondays: Feb23, Mar2, Mar9, Mar16, Mar23, Mar30, Apr6 = 7 occurrences.
    expect(occ.length).toBe(7);

    const seenOffsets = new Set();
    for (const o of occ) {
      const local = DateTime.fromMillis(o.start_utc, { zone: 'America/New_York' });
      expect(local.weekday).toBe(1); // Monday
      expect(local.toFormat('HH:mm')).toBe('16:00'); // ALWAYS 16:00 local
      seenOffsets.add(local.offset);
    }
    // The series straddles the transition, so both EST (-300) and EDT (-240) appear.
    expect(seenOffsets.has(-300)).toBe(true);
    expect(seenOffsets.has(-240)).toBe(true);
  });

  it('the absolute UTC hour shifts by 1h across the transition (local stays fixed)', () => {
    const from = DateTime.fromISO('2026-02-23T00:00:00Z').toMillis();
    const to = DateTime.fromISO('2026-04-07T00:00:00Z').toMillis();
    const occ = materializeOccurrences(rec, from, to);
    const utcHours = occ.map((o) => DateTime.fromMillis(o.start_utc, { zone: 'utc' }).hour);
    // EST: 16:00-05:00 = 21:00Z ; EDT: 16:00-04:00 = 20:00Z
    expect(new Set(utcHours)).toEqual(new Set([20, 21]));
  });
});
