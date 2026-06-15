import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  addExact,
  addCalendar,
  snapUp,
  snapDown,
  isOnGrid,
  gridCandidates,
  corridor,
  toViewer,
  GRID_MS,
  HOLD_TTL_MIN_DEFAULT,
} from '@/lib/scheduling/timekit';

const at = (iso, zone = 'utc') => DateTime.fromISO(iso, { zone }).toMillis();

describe('TimeKit addExact — physical durations (R24)', () => {
  it('adds exact second/minute/hour as fixed ms', () => {
    const t = at('2026-06-15T10:00:00Z');
    expect(addExact(t, 30, 'second')).toBe(t + 30_000);
    expect(addExact(t, 15, 'minute')).toBe(t + 15 * 60_000);
    expect(addExact(t, 2, 'hour')).toBe(t + 2 * 3_600_000);
  });

  it('2 hours is ALWAYS 7,200,000 ms even across a spring-forward DST shift', () => {
    // America/New_York spring forward 2026-03-08 02:00 -> 03:00
    const base = DateTime.fromObject(
      { year: 2026, month: 3, day: 8, hour: 1, minute: 30 },
      { zone: 'America/New_York' }
    ).toMillis();
    expect(addExact(base, 120, 'minute') - base).toBe(7_200_000);
    expect(addExact(base, 2, 'hour') - base).toBe(7_200_000);
  });

  it('throws on a non-physical unit', () => {
    expect(() => addExact(0, 1, 'day')).toThrow();
  });
});

describe('TimeKit addCalendar — calendar concepts (R24)', () => {
  it('requires an explicit anchorTz', () => {
    expect(() => addCalendar(0, 1, 'month')).toThrow(/anchorTz/);
  });

  it('clamps month-ends (Jan 31 + 1 month -> Feb 28 in a non-leap year)', () => {
    const jan31 = at('2026-01-31T12:00:00', 'America/New_York');
    const feb = addCalendar(jan31, 1, 'month', 'America/New_York');
    expect(DateTime.fromMillis(feb, { zone: 'America/New_York' }).toFormat('yyyy-LL-dd')).toBe(
      '2026-02-28'
    );
  });

  it('keeps wall-clock across DST when adding a calendar day (may be 23 or 25 real hours)', () => {
    // Day containing NY spring-forward is only 23 real hours.
    const before = at('2026-03-07T12:00:00', 'America/New_York');
    const after = addCalendar(before, 1, 'day', 'America/New_York');
    expect(DateTime.fromMillis(after, { zone: 'America/New_York' }).toFormat('HH:mm')).toBe('12:00');
    expect(after - before).toBe(23 * 3_600_000); // 23h real, same wall time
  });
});

describe('TimeKit grid (R1/R3)', () => {
  it('snapUp returns the smallest quarter-hour >= instant', () => {
    const t1320 = at('2026-06-15T13:20:00Z');
    expect(snapUp(t1320)).toBe(at('2026-06-15T13:30:00Z'));
    const onGrid = at('2026-06-15T13:30:00Z');
    expect(snapUp(onGrid)).toBe(onGrid); // already on grid
  });

  it('snapDown + isOnGrid behave', () => {
    expect(snapDown(at('2026-06-15T13:20:00Z'))).toBe(at('2026-06-15T13:15:00Z'));
    expect(isOnGrid(at('2026-06-15T13:15:00Z'))).toBe(true);
    expect(isOnGrid(at('2026-06-15T13:20:00Z'))).toBe(false);
  });

  it('gridCandidates yields every quarter-hour in [from,to] inclusive', () => {
    const from = at('2026-06-15T13:05:00Z');
    const to = at('2026-06-15T14:00:00Z');
    const c = gridCandidates(from, to);
    expect(c).toEqual([
      at('2026-06-15T13:15:00Z'),
      at('2026-06-15T13:30:00Z'),
      at('2026-06-15T13:45:00Z'),
      at('2026-06-15T14:00:00Z'),
    ]);
  });

  it('GRID_MS is 15 minutes', () => {
    expect(GRID_MS).toBe(15 * 60 * 1000);
  });

  it('gridCandidates throws on a non-finite bound (prevents an infinite loop when W is null)', () => {
    const from = at('2026-06-15T10:00:00Z');
    expect(() => gridCandidates(from, Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });
});

describe('TimeKit corridor (R4/R5)', () => {
  const t0 = at('2026-06-15T10:00:00Z');
  const teacher = {
    minNotice: { value: 2, unit: 'hour' },
    availabilityWindow: { value: 3, unit: 'month' },
    teacherTz: 'America/New_York',
    holdTtlMin: HOLD_TTL_MIN_DEFAULT,
  };

  it('instant mode: nearEdge = now + L + HOLD_TTL (drift rule R5)', () => {
    const { nearEdge } = corridor(teacher, 'instant', t0);
    expect(nearEdge).toBe(t0 + 2 * 3_600_000 + 10 * 60_000);
  });

  it('reschedule mode: nearEdge = now + L (plain, no hold)', () => {
    const { nearEdge } = corridor(teacher, 'reschedule', t0);
    expect(nearEdge).toBe(t0 + 2 * 3_600_000);
  });

  it('farEdge = now + W via calendar math', () => {
    const { farEdge } = corridor(teacher, 'instant', t0);
    expect(farEdge).toBe(addCalendar(t0, 3, 'month', 'America/New_York'));
  });

  it('null window => unbounded farEdge; null notice => nearEdge just now (+hold in instant)', () => {
    const bare = { teacherTz: 'UTC', holdTtlMin: 10 };
    const { nearEdge, farEdge } = corridor(bare, 'instant', t0);
    expect(farEdge).toBe(Number.POSITIVE_INFINITY);
    expect(nearEdge).toBe(t0 + 10 * 60_000); // L null -> 0; + HOLD_TTL
  });

  it('rejects an unknown mode', () => {
    expect(() => corridor(teacher, 'bogus', t0)).toThrow();
  });

  it('day-unit L uses calendar math for nearEdge (still + HOLD_TTL in instant mode)', () => {
    const dayNotice = {
      minNotice: { value: 2, unit: 'day' },
      teacherTz: 'America/New_York',
      holdTtlMin: 10,
    };
    const { nearEdge } = corridor(dayNotice, 'instant', t0);
    // 2 calendar days in the teacher zone, then + HOLD_TTL (exact minutes).
    const expected = addExact(addCalendar(t0, 2, 'day', 'America/New_York'), 10, 'minute');
    expect(nearEdge).toBe(expected);
  });
});

describe('TimeKit toViewer — display-only, per-viewer day column (R-display §1.2 ex.e)', () => {
  it('one instant lands on a different weekday for different viewers', () => {
    // Israel (UTC+2 winter) Sunday 2026-01-04 01:00 local == 2026-01-03 23:00Z.
    const instant = DateTime.fromObject(
      { year: 2026, month: 1, day: 4, hour: 1, minute: 0 },
      { zone: 'Asia/Jerusalem' }
    ).toMillis();

    const il = toViewer(instant, 'Asia/Jerusalem');
    expect(il.weekday).toBe(7); // luxon: Sunday
    expect(il.localDate).toBe('2026-01-04');

    const ny = toViewer(instant, 'America/New_York');
    expect(ny.weekday).toBe(6); // Saturday — different day column, same instant
    expect(ny.localDate).toBe('2026-01-03');

    // Same underlying instant for both views.
    expect(il.instant).toBe(instant);
    expect(ny.instant).toBe(instant);
  });
});
