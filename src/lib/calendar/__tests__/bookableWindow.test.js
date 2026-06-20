import { describe, it, expect } from 'vitest';
import {
  computeBookableWindow,
  parseTimeRange,
  parseHHMM,
  formatRemaining,
} from '@/lib/calendar/bookableWindow';

// Fixed "today" anchor. Local time is fine — the helper compares local calendar
// days and local minutes-of-day, and we inject `now` so tests are deterministic.
const at = (h, m = 0) => new Date(2026, 5, 15, h, m); // 2026-06-15 local
const dayOf = (offset = 0) => new Date(2026, 5, 15 + offset);

describe('parseHHMM / parseTimeRange / formatRemaining', () => {
  it('parses valid HH:MM and rejects junk', () => {
    expect(parseHHMM('06:30')).toBe(390);
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('9:5')).toBeNull();
    expect(parseHHMM('')).toBeNull();
  });

  it('parses a time range with hyphen or en-dash', () => {
    expect(parseTimeRange('06:30 - 19:30')).toEqual({ startTime: '06:30', endTime: '19:30' });
    expect(parseTimeRange('06:30 – 19:30')).toEqual({ startTime: '06:30', endTime: '19:30' });
    expect(parseTimeRange('all day')).toBeNull();
  });

  it('formats remaining duration compactly', () => {
    expect(formatRemaining(135)).toBe('2h 15m');
    expect(formatRemaining(60)).toBe('1h');
    expect(formatRemaining(45)).toBe('45m');
    expect(formatRemaining(0)).toBe('0m');
  });
});

describe('computeBookableWindow', () => {
  it('returns invalid for unparseable / inverted input', () => {
    expect(computeBookableWindow({ date: dayOf(), startTime: 'x', endTime: '10:00' }).valid).toBe(false);
    expect(computeBookableWindow({ date: dayOf(), startTime: '10:00', endTime: '09:00' }).valid).toBe(false);
    expect(computeBookableWindow({ date: null, startTime: '09:00', endTime: '10:00' }).valid).toBe(false);
  });

  it('a future day is fully bookable from its original start', () => {
    const w = computeBookableWindow({
      date: dayOf(1),
      startTime: '06:30',
      endTime: '19:30',
      now: at(23, 0),
    });
    expect(w.state).toBe('upcoming');
    expect(w.effectiveStart).toBe('06:30');
    expect(w.isPartlyElapsed).toBe(false);
    expect(w.remainingMinutes).toBe(13 * 60);
  });

  it('a past day has ended', () => {
    const w = computeBookableWindow({
      date: dayOf(-1),
      startTime: '06:30',
      endTime: '19:30',
      now: at(8, 0),
    });
    expect(w.state).toBe('ended');
    expect(w.effectiveStart).toBeNull();
    expect(w.remainingMinutes).toBe(0);
  });

  it('today before the start: upcoming, effective start unchanged', () => {
    const w = computeBookableWindow({
      date: dayOf(),
      startTime: '06:30',
      endTime: '19:30',
      now: at(5, 0),
    });
    expect(w.state).toBe('upcoming');
    expect(w.effectiveStart).toBe('06:30');
    expect(w.isPartlyElapsed).toBe(false);
  });

  it('today mid-slot: front edge rolls forward and snaps up to the 15-min grid', () => {
    const w = computeBookableWindow({
      date: dayOf(),
      startTime: '06:30',
      endTime: '19:30',
      now: at(11, 7), // 11:07 -> snaps to 11:15
    });
    expect(w.state).toBe('live');
    expect(w.effectiveStart).toBe('11:15');
    expect(w.isPartlyElapsed).toBe(true);
    expect(w.remainingMinutes).toBe(19 * 60 + 30 - (11 * 60 + 15)); // 19:30 - 11:15 = 495
  });

  it('today exactly on a grid boundary does not over-snap', () => {
    const w = computeBookableWindow({
      date: dayOf(),
      startTime: '06:30',
      endTime: '19:30',
      now: at(11, 15),
    });
    expect(w.effectiveStart).toBe('11:15');
  });

  it('today past the end: ended', () => {
    const w = computeBookableWindow({
      date: dayOf(),
      startTime: '06:30',
      endTime: '19:30',
      now: at(20, 0),
    });
    expect(w.state).toBe('ended');
    expect(w.effectiveStart).toBeNull();
    expect(w.remainingMinutes).toBe(0);
  });

  it('notice pushes the front edge further forward', () => {
    const w = computeBookableWindow({
      date: dayOf(),
      startTime: '06:30',
      endTime: '19:30',
      noticeMinutes: 120, // 2h notice
      now: at(11, 0), // 11:00 + 2h = 13:00
    });
    expect(w.effectiveStart).toBe('13:00');
    expect(w.state).toBe('live');
  });
});
