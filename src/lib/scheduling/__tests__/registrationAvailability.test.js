// @vitest-environment jsdom
// (registrationAvailability imports the Supabase client, whose realtime layer
//  needs a WebSocket constructor that the default node env lacks.)
import { describe, it, expect } from 'vitest';
import {
  weeklySlotsToDatedSlots,
  windowToDays,
  DEFAULT_WINDOW_DAYS,
  slotStart,
  slotEnd,
  slotStartHourNum,
} from '@/lib/scheduling/registrationAvailability';

const weekdayOf = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
};

describe('windowToDays — availability window -> horizon days', () => {
  it('defaults to 14 weeks (98 days)', () => {
    expect(DEFAULT_WINDOW_DAYS).toBe(98);
    expect(windowToDays(null)).toBe(98);
    expect(windowToDays({ preference: 14, preferenceType: 'weeks' })).toBe(98);
  });
  it('converts days/weeks/months', () => {
    expect(windowToDays({ preference: 10, preferenceType: 'days' })).toBe(10);
    expect(windowToDays({ preference: 3, preferenceType: 'weeks' })).toBe(21);
    expect(windowToDays({ preference: 2, preferenceType: 'months' })).toBe(60);
  });
  it('falls back to the default for invalid values', () => {
    expect(windowToDays({ preference: 0, preferenceType: 'weeks' })).toBe(98);
    expect(windowToDays({ preference: -5, preferenceType: 'weeks' })).toBe(98);
    expect(windowToDays({ preference: 5, preferenceType: 'bogus' })).toBe(98);
  });
});

describe('weeklySlotsToDatedSlots — weekly pattern -> dated slots over a horizon', () => {
  it('defaults to a 14-week horizon (14 occurrences of a weekday)', () => {
    const rows = weeklySlotsToDatedSlots({ Monday: [{ start: '09:00', end: '17:00' }] });
    expect(rows.length).toBe(14);
    expect(rows.every((r) => weekdayOf(r.date) === 1)).toBe(true);
  });

  it('honors an explicit horizon in days', () => {
    const rows = weeklySlotsToDatedSlots({ Monday: [{ start: '09:00', end: '17:00' }] }, 84);
    expect(rows.length).toBe(12); // 84 days = 12 Mondays
    expect(rows[0]).toMatchObject({ startTime: '09:00', endTime: '17:00' });
    expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('drops empty, incomplete, and inverted slots', () => {
    const rows = weeklySlotsToDatedSlots(
      { Tuesday: [{ start: '', end: '' }, { start: '10:00', end: '09:00' }, { start: '08:00', end: '09:00' }] },
      14
    );
    expect(rows.length).toBe(2); // only valid 08:00-09:00, once per week over 2 weeks
    expect(rows.every((r) => r.startTime === '08:00' && r.endTime === '09:00')).toBe(true);
  });

  it('handles multiple days and multiple slots per day within one week', () => {
    const rows = weeklySlotsToDatedSlots(
      {
        Monday: [{ start: '09:00', end: '10:00' }],
        Wednesday: [{ start: '14:00', end: '15:00' }, { start: '16:00', end: '17:00' }],
      },
      7
    );
    expect(rows.length).toBe(3); // 1 Monday + 2 Wednesday
  });

  it('returns [] for empty/invalid input', () => {
    expect(weeklySlotsToDatedSlots(null)).toEqual([]);
    expect(weeklySlotsToDatedSlots({})).toEqual([]);
  });
});

describe('slot accessors unify start/end with legacy startHour/endHour', () => {
  it('prefer start/end, fall back to startHour/endHour', () => {
    expect(slotStart({ start: '09:00' })).toBe('09:00');
    expect(slotStart({ startHour: '08:00' })).toBe('08:00');
    expect(slotEnd({ end: '10:00' })).toBe('10:00');
    expect(slotEnd({ endHour: '11:00' })).toBe('11:00');
  });

  it('slotStartHourNum parses the leading hour, null when absent', () => {
    expect(slotStartHourNum({ start: '09:30' })).toBe(9);
    expect(slotStartHourNum({ startHour: '14:00' })).toBe(14);
    expect(slotStartHourNum({ start: '' })).toBeNull();
  });
});
