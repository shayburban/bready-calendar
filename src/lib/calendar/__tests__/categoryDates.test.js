import { describe, it, expect } from 'vitest';
import { categoryDatesForPicker, eventsForDate } from '@/lib/calendar/categoryDates';

// Output is local 'YYYY-MM-DD' — parse the string directly (timezone-independent).
const dayFromISO = (s) => Number(s.split('-')[2]);
const monthFromISO = (s) => Number(s.split('-')[1]) - 1;

const events = [
  { id: 3, date: 19, time: '13:00 - 14:00', type: 'booked', role: 'T' },
  { id: 4, date: 20, time: '10:00 - 11:00', type: 'booked', role: 'S' },
  { id: 10, date: 22, time: '10:00 - 11:00', type: 'completed', role: 'T' },
];

const savedSlots = [
  { date: '2026-06-15', startTime: '09:00', endTime: '10:00' },
  { date: '2026-06-18', startTime: '11:00', endTime: '12:00' },
];

describe('categoryDatesForPicker', () => {
  it('availability (T) uses the real saved slot dates', () => {
    const out = categoryDatesForPicker({
      events,
      savedSlots,
      type: 'availability',
      role: 'T',
      center: new Date(2026, 5, 15),
      monthsBack: 0,
      monthsFwd: 0,
    });
    const days = out.map(dayFromISO).sort((a, b) => a - b);
    expect(days).toEqual([15, 18]);
    // Regression: dates must be the EXACT local 'YYYY-MM-DD' the teacher saved,
    // never shifted by a toISOString() round-trip (was June 15 -> June 14 in
    // east-of-UTC zones, so the real slot didn't highlight in the picker).
    expect(out).toContain('2026-06-15');
    expect(out).toContain('2026-06-18');
  });

  it('materializes a month-agnostic booked:T event on its day across the window', () => {
    const out = categoryDatesForPicker({
      events,
      savedSlots,
      type: 'booked',
      role: 'T',
      center: new Date(2026, 5, 15),
      monthsBack: 1,
      monthsFwd: 1,
    });
    // booked:T is day 19; window is May/Jun/Jul 2026 → three dates, all day 19.
    expect(out).toHaveLength(3);
    expect(out.every((iso) => dayFromISO(iso) === 19)).toBe(true);
    const months = out.map(monthFromISO).sort((a, b) => a - b);
    expect(months).toEqual([4, 5, 6]);
  });

  it('separates by role — booked:S does not include booked:T days', () => {
    const out = categoryDatesForPicker({
      events,
      savedSlots,
      type: 'booked',
      role: 'S',
      center: new Date(2026, 5, 15),
      monthsBack: 0,
      monthsFwd: 0,
    });
    expect(out.map(dayFromISO)).toEqual([20]);
  });

  it('returns empty for a type with no matching events', () => {
    expect(
      categoryDatesForPicker({ events, savedSlots, type: 'waiting', role: 'T', monthsBack: 0, monthsFwd: 0 })
    ).toEqual([]);
  });
});

describe('eventsForDate', () => {
  it('availability (T) synthesizes events from saved slots on that day', () => {
    const out = eventsForDate({
      events,
      savedSlots,
      type: 'availability',
      role: 'T',
      dateISO: new Date(2026, 5, 15).toISOString(),
    });
    expect(out).toHaveLength(1);
    expect(out[0].time).toBe('09:00 - 10:00');
    expect(out[0].type).toBe('availability');
  });

  it('other types match master events by day-of-month + type + role', () => {
    const out = eventsForDate({
      events,
      savedSlots,
      type: 'booked',
      role: 'T',
      dateISO: new Date(2026, 7, 19).toISOString(), // any month, day 19
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(3);
    expect(out[0].dateString).toBe(new Date(2026, 7, 19).toISOString());
  });

  it('returns [] when nothing matches that day', () => {
    expect(
      eventsForDate({ events, savedSlots, type: 'booked', role: 'T', dateISO: new Date(2026, 7, 1).toISOString() })
    ).toEqual([]);
  });
});
