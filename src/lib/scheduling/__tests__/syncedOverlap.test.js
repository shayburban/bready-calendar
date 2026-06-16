import { describe, it, expect } from 'vitest';
import { intervalsOverlap, overlapRegion, syncedStripes, bookingSyncedFlag, minutesOfDay, parseWallRange } from '@/lib/scheduling/syncedOverlap';

const ev = (name, s, e) => ({ id: name, name, start: s, end: e });
const H = (h) => Date.UTC(2026, 5, 20, h, 0, 0); // 2026-06-20 hh:00 UTC (ms)

describe('syncedOverlap — interval math', () => {
  it('detects overlap; half-open so touching does NOT overlap', () => {
    expect(intervalsOverlap(H(9), H(11), H(10), H(12))).toBe(true);
    expect(intervalsOverlap(H(9), H(10), H(10), H(11))).toBe(false); // touch at 10:00
    expect(intervalsOverlap(H(9), H(12), H(10), H(11))).toBe(true);  // contained
    expect(intervalsOverlap(H(9), H(10), H(11), H(12))).toBe(false); // disjoint
  });
  it('overlapRegion is the intersection, or null', () => {
    expect(overlapRegion(H(9), H(11), H(10), H(12))).toEqual({ start: H(10), end: H(11) });
    expect(overlapRegion(H(9), H(10), H(10), H(11))).toBeNull();
  });
});

describe('syncedStripes — yellow layer (R15b, P3, teacher-only)', () => {
  it('stripes each synced×block overlap with the event name + kind', () => {
    const stripes = syncedStripes([ev('Dentist', H(10), H(11))], [{ id: 'a1', kind: 'availability', start: H(9), end: H(17) }]);
    expect(stripes).toHaveLength(1);
    expect(stripes[0]).toMatchObject({ eventName: 'Dentist', kind: 'availability', blockId: 'a1', start: H(10), end: H(11) });
  });
  it('no stripe when nothing overlaps', () => {
    expect(syncedStripes([ev('X', H(18), H(19))], [{ kind: 'availability', start: H(9), end: H(17) }])).toEqual([]);
  });
  it('handles multiple events/blocks and ignores malformed entries', () => {
    const synced = [ev('A', H(10), H(11)), ev('B', H(12), H(13)), { name: 'bad' }, null];
    const blocks = [{ kind: 'booked', start: H(9), end: H(12) }, { kind: 'availability', start: H(12), end: H(14) }];
    expect(syncedStripes(synced, blocks).map((s) => s.eventName).sort()).toEqual(['A', 'B']);
  });
  it('returns [] for non-array input (never throws)', () => {
    expect(syncedStripes(null, null)).toEqual([]);
  });
});

describe('bookingSyncedFlag — confirmation decoration (R15d, P4)', () => {
  it('returns the overlapping event names', () => {
    expect(bookingSyncedFlag({ start: H(10), end: H(11) }, [ev('Gym', H(10), H(12)), ev('Far', H(15), H(16))])).toEqual(['Gym']);
  });
  it('returns [] when the booking overlaps nothing', () => {
    expect(bookingSyncedFlag({ start: H(10), end: H(11) }, [ev('Far', H(15), H(16))])).toEqual([]);
  });
});

describe('wall-clock adapters — minutesOfDay / parseWallRange (R15b, display-only)', () => {
  it('minutesOfDay parses HH:MM and rejects junk / out-of-range', () => {
    expect(minutesOfDay('00:00')).toBe(0);
    expect(minutesOfDay('16:30')).toBe(990);
    expect(minutesOfDay('23:59')).toBe(1439);
    expect(minutesOfDay('9:05')).toBe(545);
    expect(minutesOfDay('24:00')).toBeNull();
    expect(minutesOfDay('12:60')).toBeNull();
    expect(minutesOfDay('noon')).toBeNull();
    expect(minutesOfDay(null)).toBeNull();
  });
  it('parseWallRange returns {start,end} minutes, null on bad/non-positive span', () => {
    expect(parseWallRange('16:00 - 17:00')).toEqual({ start: 960, end: 1020 });
    expect(parseWallRange('17:00 - 19:00')).toEqual({ start: 1020, end: 1140 });
    expect(parseWallRange('17:00 - 17:00')).toBeNull(); // zero span
    expect(parseWallRange('18:00 - 09:00')).toBeNull(); // reversed
    expect(parseWallRange('16:00')).toBeNull();         // missing end
    expect(parseWallRange(42)).toBeNull();
  });
  it('feeds syncedStripes in minutes-of-day for a same-day overlap', () => {
    const synced = [{ id: 9, name: 'Google Calendar event', ...parseWallRange('16:00 - 17:00') }];
    const blocks = [{ id: 'a', kind: 'availability', ...parseWallRange('15:00 - 18:00') }];
    const stripes = syncedStripes(synced, blocks);
    expect(stripes).toHaveLength(1);
    expect(stripes[0]).toMatchObject({
      eventName: 'Google Calendar event', kind: 'availability', blockId: 'a', start: 960, end: 1020,
    });
  });
});
