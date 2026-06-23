import { describe, it, expect } from 'vitest';
import { freebusyToSyncedEvents } from '@/lib/freebusyToSyncedEvents';

const ms = (s) => Date.parse(s);

describe('freebusyToSyncedEvents — UTC busy intervals -> calendar synced shape', () => {
  it('maps a within-day interval to one "Busy" synced event (date-exact)', () => {
    const out = freebusyToSyncedEvents([{ start: ms('2026-06-21T16:00:00Z'), end: ms('2026-06-21T17:00:00Z') }], 'UTC');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ type: 'synced', date: 21, year: 2026, month: 5, time: '16:00 - 17:00', description: 'Busy' });
  });

  it('never leaks event content — name is always "Busy"', () => {
    const out = freebusyToSyncedEvents([{ start: ms('2026-06-21T09:00:00Z'), end: ms('2026-06-21T10:00:00Z') }], 'UTC');
    expect(out.every((e) => e.description === 'Busy')).toBe(true);
  });

  it('splits a midnight-crossing interval into one segment per local day', () => {
    const out = freebusyToSyncedEvents([{ start: ms('2026-06-21T22:00:00Z'), end: ms('2026-06-22T01:00:00Z') }], 'UTC');
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ date: 21, time: '22:00 - 23:59' });
    expect(out[1]).toMatchObject({ date: 22, time: '00:00 - 01:00' });
  });

  it('ignores empty / invalid intervals', () => {
    expect(freebusyToSyncedEvents([], 'UTC')).toEqual([]);
    expect(freebusyToSyncedEvents(null, 'UTC')).toEqual([]);
    expect(freebusyToSyncedEvents([{ start: 100, end: 100 }], 'UTC')).toEqual([]);
  });
});
