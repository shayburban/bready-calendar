import { describe, it, expect } from 'vitest';
import { availabilityToRows } from '@/lib/scheduling/availabilityToRows';

// Assert against canonical epoch (via Date in the test, which is NOT T1-scoped)
// so the exact luxon ISO spelling (Z vs +00:00) doesn't make the test brittle.
const iso = (s) => new Date(s).toISOString();

describe('availabilityToRows — teacher wall-clock → absolute UTC (R24/R25)', () => {
  it('converts a New York summer block (EDT -04:00) to UTC', () => {
    const rows = availabilityToRows([{ date: '2026-06-20', startTime: '09:00', endTime: '17:00' }], 'America/New_York');
    expect(rows).toHaveLength(1);
    expect(iso(rows[0].start_utc)).toBe('2026-06-20T13:00:00.000Z');
    expect(iso(rows[0].end_utc)).toBe('2026-06-20T21:00:00.000Z');
  });

  it('converts an Israel winter block (IST +02:00) to UTC', () => {
    const rows = availabilityToRows([{ date: '2026-01-15', startTime: '09:00', endTime: '12:00' }], 'Asia/Jerusalem');
    expect(iso(rows[0].start_utc)).toBe('2026-01-15T07:00:00.000Z');
    expect(iso(rows[0].end_utc)).toBe('2026-01-15T10:00:00.000Z');
  });

  it('keeps the 15-min grid for a :45 offset zone (Kathmandu +05:45)', () => {
    const rows = availabilityToRows([{ date: '2026-06-20', startTime: '09:00', endTime: '10:30' }], 'Asia/Kathmandu');
    expect(iso(rows[0].start_utc)).toBe('2026-06-20T03:15:00.000Z'); // 09:00 - 5:45
    expect(iso(rows[0].end_utc)).toBe('2026-06-20T04:45:00.000Z');
    // both starts land on the quarter-hour grid (epoch % 900s == 0)
    expect(Date.parse(rows[0].start_utc) / 1000 % 900).toBe(0);
    expect(Date.parse(rows[0].end_utc) / 1000 % 900).toBe(0);
  });

  it('drops invalid, zero-length, and malformed slots', () => {
    const rows = availabilityToRows([
      { date: '2026-06-20', startTime: '09:00', endTime: '09:00' }, // zero-length
      { date: '2026-06-20', startTime: '17:00', endTime: '09:00' }, // reversed
      { date: '2026-06-20', startTime: '09:00' },                    // missing end
      null,
      { date: '2026-06-20', startTime: '10:00', endTime: '11:00' },  // the one good slot
    ], 'America/New_York');
    expect(rows).toHaveLength(1);
    expect(iso(rows[0].start_utc)).toBe('2026-06-20T14:00:00.000Z');
  });

  it('returns [] for missing tz or non-array input', () => {
    expect(availabilityToRows([{ date: '2026-06-20', startTime: '09:00', endTime: '10:00' }], null)).toEqual([]);
    expect(availabilityToRows(null, 'UTC')).toEqual([]);
  });
});
