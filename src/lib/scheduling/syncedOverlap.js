// Stage 8 — yellow synced-events layer (R14–R15). PURE annotation logic.
//
// CRITICAL (R14): synced calendar events NEVER take part in bookability. They are
// NOT an input to EffectiveBookable (P1) or any write checkpoint (P2) — note
// evaluateStart()/bookable_slots take no synced argument at all. This module only
// DESCRIBES overlaps for the teacher's yellow warning layer (P3) and the booking
// confirmation overlap flag (P4); it can never remove a bookable slot or block a
// write. Nothing here is stored — stripes are recomputed live, so an external
// move/delete clears them automatically (R15b).
//
// Times are absolute UTC instants (epoch ms) — the same substrate as the rest of
// scheduling (R24). Synced event NAMES are teacher-only (R15g); the public
// surface must never import this module.

// Half-open intervals [aStart,aEnd) and [bStart,bEnd): do they overlap?
export const intervalsOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && bStart < aEnd;

// The overlapping sub-interval, or null when they don't overlap.
export const overlapRegion = (aStart, aEnd, bStart, bEnd) => {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return start < end ? { start, end } : null;
};

// --- Wall-clock adapters (DISPLAY-ONLY, R15b) -------------------------------
// The teacher calendar stores synced events + availability/booked/pending chips
// as same-day wall-clock 'HH:MM - HH:MM'. Because both sides of a striping
// comparison sit on the SAME rendered day, minutes-of-day is a sufficient,
// tz-free coordinate for the purely VISUAL yellow layer. This is never an input
// to bookability — that is always an absolute UTC instant (R24). Keep these out
// of any P1/P2 path; the public surface must not import this module (R15g).

// 'HH:MM' → minutes-of-day (0..1439), or null when unparseable / out of range.
export const minutesOfDay = (hhmm) => {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

// 'HH:MM - HH:MM' → { start, end } in minutes-of-day, or null. A non-positive
// span returns null so a malformed chip can never yield a phantom overlap.
export const parseWallRange = (range) => {
  if (typeof range !== 'string') return null;
  const parts = range.split(' - ');
  if (parts.length !== 2) return null;
  const start = minutesOfDay(parts[0]);
  const end = minutesOfDay(parts[1]);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
};

const finite = (x) => Number.isFinite(x);

// syncedStripes: the yellow stripes where synced events overlap the teacher's own
// blocks (availability / booked / pending). Pure + live (R15b — nothing stored).
//   synced: [{ id?, name, start, end }]                                   (UTC ms)
//   blocks: [{ id?, kind: 'availability'|'booked'|'pending', start, end }] (UTC ms)
// -> [{ eventId, eventName, kind, blockId, start, end }] — the overlap regions.
export const syncedStripes = (synced, blocks) => {
  const out = [];
  if (!Array.isArray(synced) || !Array.isArray(blocks)) return out;
  for (const ev of synced) {
    if (!ev || !finite(ev.start) || !finite(ev.end)) continue;
    for (const b of blocks) {
      if (!b || !finite(b.start) || !finite(b.end)) continue;
      const region = overlapRegion(ev.start, ev.end, b.start, b.end);
      if (region) {
        out.push({
          eventId: ev.id ?? null,
          eventName: ev.name ?? null,
          kind: b.kind ?? null,
          blockId: b.id ?? null,
          start: region.start,
          end: region.end,
        });
      }
    }
  }
  return out;
};

// bookingSyncedFlag: the synced events a booking overlaps, for the teacher's
// confirmation decoration (R15d / P4). Returns teacher-only names[] (or []).
export const bookingSyncedFlag = (booking, synced) => {
  if (!booking || !finite(booking.start) || !finite(booking.end) || !Array.isArray(synced)) return [];
  return synced
    .filter((ev) => ev && finite(ev.start) && finite(ev.end) && intervalsOverlap(booking.start, booking.end, ev.start, ev.end))
    .map((ev) => ev.name ?? null)
    .filter(Boolean);
};
