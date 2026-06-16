import { describe, it, expect } from 'vitest';
import { intervalsOverlap, overlapRegion, syncedStripes, bookingSyncedFlag } from '@/lib/scheduling/syncedOverlap';

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
