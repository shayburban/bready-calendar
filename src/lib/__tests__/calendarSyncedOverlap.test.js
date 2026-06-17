import { describe, it, expect } from 'vitest';
import {
  syncedNoteForDay,
  syncedOverlapsForSlots,
} from '@/lib/calendarSyncedOverlap';

// sampleEvents has a synced 'Google Calendar event' on day 21 at 16:00–17:00
// (id 9). These tests pin the partial-day intersection that the calendar's
// amber chip (Phase 4.2) and the sidebar pre-save warning (Phase 1) both rely on.

const synced = { id: 's1', type: 'synced', time: '16:00 - 17:00', description: 'Google Calendar event' };

describe('syncedNoteForDay — partial vs full-day chip overlap (Phase 4.2 / R15b)', () => {
  it('flags a PARTIAL-day availability that overlaps a synced event', () => {
    const partial = { id: 'a1', type: 'availability', time: '14:45 - 16:30' };
    const note = syncedNoteForDay([synced, partial]);
    expect(note).toBeInstanceOf(Map);
    expect([...note.get('a1')]).toEqual(['Google Calendar event']);
  });
  it('flags a full-day (00:00–23:59) availability too', () => {
    const allDay = { id: 'a2', type: 'availability', time: '00:00 - 23:59' };
    expect(syncedNoteForDay([synced, allDay]).get('a2')).toBeInstanceOf(Set);
  });
  it('flags a booked block that partially overlaps', () => {
    const booked = { id: 'b1', type: 'booked', time: '16:30 - 17:30' };
    expect(syncedNoteForDay([synced, booked]).get('b1')).toBeInstanceOf(Set);
  });
  it('does NOT flag a block that only TOUCHES the synced event (half-open)', () => {
    const touch = { id: 'a3', type: 'availability', time: '15:00 - 16:00' };
    expect(syncedNoteForDay([synced, touch])).toBeNull();
  });
  it('returns null when there is no synced event or no block', () => {
    expect(syncedNoteForDay([{ id: 'a', type: 'availability', time: '09:00 - 10:00' }])).toBeNull();
    expect(syncedNoteForDay([synced])).toBeNull();
  });
});

describe('syncedOverlapsForSlots — pre-save detector (Phase 1 / R15a)', () => {
  it('detects a PARTIAL-day slot overlapping the day-21 synced event', () => {
    const r = syncedOverlapsForSlots([{ date: '2026-06-21', startTime: '14:45', endTime: '16:30' }]);
    expect(r).toEqual([{ name: 'Google Calendar event', range: '16:00 - 17:00' }]);
  });
  it('detects an all-day slot overlapping it', () => {
    const r = syncedOverlapsForSlots([{ date: '2026-06-21', startTime: '00:00', endTime: '23:59' }]);
    expect(r.map((o) => o.name)).toContain('Google Calendar event');
  });
  it('returns [] for a non-overlapping time on the same day', () => {
    expect(syncedOverlapsForSlots([{ date: '2026-06-21', startTime: '09:00', endTime: '10:00' }])).toEqual([]);
  });
  it('returns [] for a day with no synced event', () => {
    expect(syncedOverlapsForSlots([{ date: '2026-06-15', startTime: '16:00', endTime: '17:00' }])).toEqual([]);
  });
  it('returns [] for a reversed/invalid range (documents the dropped-block root cause)', () => {
    expect(syncedOverlapsForSlots([{ date: '2026-06-21', startTime: '16:30', endTime: '14:45' }])).toEqual([]);
  });
  it('dedupes + tolerates malformed input', () => {
    expect(syncedOverlapsForSlots(null)).toEqual([]);
    const dup = syncedOverlapsForSlots([
      { date: '2026-06-21', startTime: '15:30', endTime: '16:15' },
      { date: '2026-06-21', startTime: '16:30', endTime: '16:45' },
    ]);
    expect(dup).toEqual([{ name: 'Google Calendar event', range: '16:00 - 17:00' }]);
  });
});
