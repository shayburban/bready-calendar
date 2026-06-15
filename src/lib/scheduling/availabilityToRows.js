// Convert teacher-painted availability slots to absolute-UTC rows for the
// set_availability_one_off RPC (0012). The teacher paints in their own wall-clock
// ({ date: "YYYY-MM-DD", startTime: "HH:MM", endTime: "HH:MM" }); we serialize
// each to an absolute UTC instant via TimeKit (R24) using the teacher's IANA zone
// as the anchor. Invalid / zero-length / overnight entries are dropped rather
// than throwing, so one bad slot can't sink an entire save.

import { wallClockToUtcISO } from '@/lib/scheduling/timekit';

export const availabilityToRows = (slots, tz) => {
  if (!Array.isArray(slots) || !tz) return [];
  const rows = [];
  for (const s of slots) {
    if (!s || !s.date || !s.startTime || !s.endTime) continue;
    let start_utc;
    let end_utc;
    try {
      start_utc = wallClockToUtcISO(s.date, s.startTime, tz);
      end_utc = wallClockToUtcISO(s.date, s.endTime, tz);
    } catch {
      continue; // unparseable date/time/zone — skip this slot
    }
    // Same-format UTC ISO strings compare chronologically by lexical order, so
    // this also drops zero-length and (crudely) overnight wrap entries.
    if (!start_utc || !end_utc || start_utc >= end_utc) continue;
    rows.push({ start_utc, end_utc });
  }
  return rows;
};
