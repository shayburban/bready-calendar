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
