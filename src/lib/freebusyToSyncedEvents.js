// Adapter: real freebusy busy intervals (absolute UTC ms) -> the calendar's
// existing synced-event shape, split per LOCAL day in the teacher's timezone, so
// they flow through the already-tested syncedNoteForDay / syncedOverlapsForSlots
// path with NO change to the rendering logic. Names are ALWAYS "Busy" (R15g — no
// external event content). A multi-day / all-day busy block becomes one segment
// per local day. See docs/google-calendar-sync-v1.md §3.5.

import { DateTime } from 'luxon';

// intervals: [{ start, end }] epoch ms. tz: IANA zone (defaults to browser zone).
// Returns [{ id, type:'synced', date, year, month, time, description:'Busy' }]
// where date = day-of-month, month = 0-based (matching the calendar's events).
export function freebusyToSyncedEvents(intervals, tz) {
  const zone = tz || DateTime.local().zoneName;
  const out = [];
  let n = 0;
  for (const iv of intervals || []) {
    if (!iv || !Number.isFinite(iv.start) || !Number.isFinite(iv.end) || iv.end <= iv.start) continue;
    let cur = DateTime.fromMillis(iv.start, { zone });
    const end = DateTime.fromMillis(iv.end, { zone });

    // walk local days the interval covers (bounded — freebusy window is ~3 months)
    let guard = 0;
    while (cur < end && guard++ < 400) {
      const dayEnd = cur.endOf('day'); // 23:59:59.999 local
      const segEnd = end <= dayEnd ? end : dayEnd;

      const startHHMM = cur.toFormat('HH:mm');
      // clamp a segment that runs to the day boundary to 23:59 so HH:MM stays valid
      const endHHMM = segEnd >= dayEnd ? '23:59' : segEnd.toFormat('HH:mm');

      if (startHHMM !== endHHMM) {
        out.push({
          id: `fb-${n++}`,
          type: 'synced',
          date: cur.day,
          year: cur.year,
          month: cur.month - 1, // 0-based, matching sampleEvents
          time: `${startHHMM} - ${endHHMM}`,
          description: 'Busy',
        });
      }
      cur = dayEnd.plus({ milliseconds: 1 }).startOf('day'); // next local midnight
    }
  }
  return out;
}
