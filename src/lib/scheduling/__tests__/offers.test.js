import { describe, it, expect } from 'vitest';
import { generateOffers, publicSlots } from '@/lib/scheduling/offers';

const u = (h, m = 0) => Date.UTC(2026, 5, 15, h, m); // 2026-06-15 UTC
const hhmm = (ms) => {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

describe('generateOffers — R2 legacy off-grid block (§8 case 10)', () => {
  it('a 13:05–15:50 block offers 60-min lessons at 13:15…14:45, record untouched', () => {
    const availability = [{ start: u(13, 5), end: u(15, 50) }];
    const before = JSON.stringify(availability);

    const { offersByDuration } = generateOffers({
      availability,
      durations: [60],
      from: u(13),
      to: u(16),
    });

    expect(offersByDuration[60].map(hhmm)).toEqual([
      '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
    ]);
    // R2 / Constraint 4 — the availability record must NOT be mutated.
    expect(JSON.stringify(availability)).toBe(before);
  });
});

describe('generateOffers — R3 snapUp after a break', () => {
  it('lesson ends 13:00, B=20 → next 60-min candidate is 13:30 (not 13:15)', () => {
    const { offersByDuration } = generateOffers({
      availability: [{ start: u(12), end: u(16) }],
      blockers: [{ type: 'booked', start_utc: u(12), end_utc: u(13) }],
      breakMinutes: 20,
      durations: [60],
      from: u(12),
      to: u(16),
    });
    const starts = offersByDuration[60].map(hhmm);
    expect(starts).toContain('13:30');
    expect(starts).not.toContain('13:15'); // inside the 13:00–13:20 break shadow
    expect(starts).not.toContain('12:00'); // overlaps the booked lesson
    expect(starts[0]).toBe('13:30'); // first bookable start after the break
  });
});

describe('generateOffers — corridor on the START (R4)', () => {
  it('only emits starts within [nearEdge, farEdge]; end may pass farEdge', () => {
    const { offersByDuration } = generateOffers({
      availability: [{ start: u(10), end: u(16) }],
      durations: [60],
      corridor: { nearEdge: u(12), farEdge: u(14) },
      from: u(10),
      to: u(16),
    });
    const starts = offersByDuration[60].map(hhmm);
    expect(starts[0]).toBe('12:00'); // nearEdge
    expect(starts[starts.length - 1]).toBe('14:00'); // farEdge (start), end 15:00 ok
    expect(starts).not.toContain('11:45');
    expect(starts).not.toContain('14:15');
  });
});

describe('publicSlots — R18 projection (start_utc + durations only)', () => {
  it('groups durations by start, sorted, with NO private fields', () => {
    const s1 = u(10);
    const s2 = u(10, 30);
    const slots = publicSlots({ 30: [s1, s2], 60: [s1] });
    expect(slots).toEqual([
      { start_utc: s1, durations: [30, 60] },
      { start_utc: s2, durations: [30] },
    ]);
    // R18 — exactly two keys, nothing leaked (no state/reason/name/viewerTz).
    expect(Object.keys(slots[0]).sort()).toEqual(['durations', 'start_utc']);
  });
});
