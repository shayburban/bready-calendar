import { describe, it, expect } from 'vitest';
import { expandRepeatDates, toYMD } from '@/lib/calendar/repeatDates';

// Thu 18 June 2026 (getDay() === 4).
const start = new Date(2026, 5, 18);

describe('expandRepeatDates', () => {
  it('returns just the single date when repeat is off', () => {
    expect(expandRepeatDates({ startDate: start, weekdays: [], repeatWeeks: 0 })).toEqual(['2026-06-18']);
  });

  it('returns single date when weeks >= 1 but no weekday active', () => {
    expect(expandRepeatDates({ startDate: start, weekdays: [], repeatWeeks: 12 })).toEqual(['2026-06-18']);
  });

  it('repeats weekly on the start weekday for N weeks (inclusive of start)', () => {
    const r = expandRepeatDates({ startDate: start, weekdays: [4], repeatWeeks: 3 });
    // 3 weeks * 7 days from Thu 18 → Thursdays 18, 25 June; 2 July (16 June..7 July window).
    expect(r).toEqual(['2026-06-18', '2026-06-25', '2026-07-02']);
  });

  it('includes multiple weekdays and always keeps the start date', () => {
    // Mon(1)+Wed(3) for 1 week, starting Thu 18 → start kept + Mon22/Wed24.
    const r = expandRepeatDates({ startDate: start, weekdays: [1, 3], repeatWeeks: 1 });
    expect(r).toContain('2026-06-18'); // start always present
    expect(r).toContain('2026-06-22'); // Mon
    expect(r).toContain('2026-06-24'); // Wed
  });

  it('toYMD formats local date parts', () => {
    expect(toYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toYMD('not a date')).toBeNull();
  });

  it('returns [] for no start date', () => {
    expect(expandRepeatDates({ startDate: null, weekdays: [1], repeatWeeks: 4 })).toEqual([]);
  });
});
