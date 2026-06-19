// @vitest-environment jsdom
// (registrationAvailability imports the Supabase client, whose realtime layer
//  needs a WebSocket constructor that the default node env lacks.)
import { describe, it, expect } from 'vitest';
import {
  weeklySlotsToDatedSlots,
  slotStart,
  slotEnd,
  slotStartHourNum,
} from '@/lib/scheduling/registrationAvailability';

const weekdayOf = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
};

describe('weeklySlotsToDatedSlots — weekly pattern -> dated slots', () => {
  it('emits one slot per upcoming Monday over the horizon, all Mondays', () => {
    const rows = weeklySlotsToDatedSlots({ Monday: [{ start: '09:00', end: '17:00' }] }, 12);
    expect(rows.length).toBe(12);
    expect(rows.every((r) => weekdayOf(r.date) === 1)).toBe(true);
    expect(rows[0]).toMatchObject({ startTime: '09:00', endTime: '17:00' });
    expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('drops empty, incomplete, and inverted slots', () => {
    const rows = weeklySlotsToDatedSlots(
      { Tuesday: [{ start: '', end: '' }, { start: '10:00', end: '09:00' }, { start: '08:00', end: '09:00' }] },
      2
    );
    expect(rows.length).toBe(2); // only the valid 08:00-09:00, once per week
    expect(rows.every((r) => r.startTime === '08:00' && r.endTime === '09:00')).toBe(true);
  });

  it('handles multiple days and multiple slots per day', () => {
    const rows = weeklySlotsToDatedSlots(
      {
        Monday: [{ start: '09:00', end: '10:00' }],
        Wednesday: [{ start: '14:00', end: '15:00' }, { start: '16:00', end: '17:00' }],
      },
      1
    );
    expect(rows.length).toBe(3); // 1 Monday + 2 Wednesday within one week
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
