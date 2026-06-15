import { describe, it, expect, afterEach } from 'vitest';
import FakeTimers from '@sinonjs/fake-timers';
import { DateTime } from 'luxon';
import { now, corridor, materializeOccurrences } from '@/lib/scheduling/timekit';

// T-C — server-clock mocking at DST boundaries. We freeze now() at 1s before,
// exactly at, and 1s after each transition and assert physical arithmetic holds.
describe('T-C — clock frozen at DST transitions (R24)', () => {
  let clock;
  afterEach(() => {
    if (clock) clock.uninstall();
    clock = undefined;
  });

  // NY spring forward 2026-03-08T07:00:00Z (02:00 local -> 03:00 local).
  const springUtc = DateTime.fromISO('2026-03-08T07:00:00Z').toMillis();
  // NY fall back 2026-11-01T06:00:00Z (02:00 EDT -> 01:00 EST).
  const fallUtc = DateTime.fromISO('2026-11-01T06:00:00Z').toMillis();

  for (const [label, edge] of [['spring-forward', springUtc], ['fall-back', fallUtc]]) {
    for (const delta of [-1000, 0, 1000]) {
      it(`${label} @ ${delta}ms: now() reflects frozen clock; L=2h stays exactly 7.2e6 ms`, () => {
        clock = FakeTimers.install({ now: edge + delta });
        expect(now()).toBe(edge + delta);
        const teacher = { minNotice: { value: 2, unit: 'hour' }, teacherTz: 'America/New_York' };
        const { nearEdge } = corridor(teacher, 'reschedule', now());
        expect(nearEdge - now()).toBe(7_200_000); // physical 2h regardless of the transition
      });
    }
  }
});

// T-D — nonexistent / ambiguous local times each resolve to ONE stable, valid
// UTC instant (R25). Conventions: gap -> shift forward; overlap -> earlier offset.
describe('T-D — spring-forward gap & fall-back overlap resolve to one instant (R25)', () => {
  it('a recurring slot whose wall time falls in the spring-forward gap yields one valid instant', () => {
    // NY 02:30 on 2026-03-08 does not exist; convention advances to 03:30 EDT.
    const rec = {
      anchor_iana_tz: 'America/New_York',
      local_wallclock_start: '02:30',
      duration_minutes: 60,
      rrule: 'FREQ=DAILY',
      range_start_date: '2026-03-08',
      range_end_date: '2026-03-08',
    };
    const from = DateTime.fromISO('2026-03-08T00:00:00Z').toMillis();
    const to = DateTime.fromISO('2026-03-09T00:00:00Z').toMillis();
    const occ = materializeOccurrences(rec, from, to);
    expect(occ).toHaveLength(1);
    const local = DateTime.fromMillis(occ[0].start_utc, { zone: 'America/New_York' });
    expect(local.toFormat('HH:mm')).toBe('03:30'); // shifted forward out of the gap
    expect(local.offset).toBe(-240); // EDT
    expect(occ[0].end_utc - occ[0].start_utc).toBe(60 * 60_000);
  });

  it('a recurring slot in the fall-back overlap picks the earlier (pre-transition) instant', () => {
    // NY 01:30 on 2026-11-01 occurs twice; convention picks EDT (-240), the earlier one.
    const rec = {
      anchor_iana_tz: 'America/New_York',
      local_wallclock_start: '01:30',
      duration_minutes: 60,
      rrule: 'FREQ=DAILY',
      range_start_date: '2026-11-01',
      range_end_date: '2026-11-01',
    };
    const from = DateTime.fromISO('2026-11-01T00:00:00Z').toMillis();
    const to = DateTime.fromISO('2026-11-02T00:00:00Z').toMillis();
    const occ = materializeOccurrences(rec, from, to);
    expect(occ).toHaveLength(1);
    const local = DateTime.fromMillis(occ[0].start_utc, { zone: 'America/New_York' });
    expect(local.toFormat('HH:mm')).toBe('01:30');
    expect(local.offset).toBe(-240); // EDT, the earlier of the two 01:30s
  });
});
