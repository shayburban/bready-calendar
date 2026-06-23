// Absolute-UTC interval math (server copy; mirrors src/lib/scheduling/syncedOverlap.js).
//
// Kept self-contained (~no deps, no Vite '@' alias) so Vercel functions can bundle
// it. The booking-self-subtraction below is the only correct way to stop a teacher's
// own lessons from self-warning, because freebusy.query returns NO event ids — we
// can't filter by id, so we subtract our own intervals from the busy set.
//
// Intervals are { start, end } in epoch milliseconds, half-open [start, end).

export const intervalsOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && bStart < aEnd;

export const overlapRegion = (aStart, aEnd, bStart, bEnd) => {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return start < end ? { start, end } : null;
};

// Merge overlapping/adjacent intervals into a minimal sorted set.
export function mergeIntervals(list) {
  const xs = (list || [])
    .filter((i) => i && Number.isFinite(i.start) && Number.isFinite(i.end) && i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out = [];
  for (const i of xs) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else out.push({ start: i.start, end: i.end });
  }
  return out;
}

// Subtract `holes` (our own lessons) from `base` (the freebusy busy set).
// Returns the remaining external-only intervals, merged + sorted. Interval-set
// subtraction, not a filter: a lesson that covers only part of a busy block trims
// just that part, never drops the whole block.
export function subtractIntervals(base, holes) {
  const merged = mergeIntervals(base);
  const cuts = mergeIntervals(holes);
  const out = [];
  for (const b of merged) {
    let segments = [{ start: b.start, end: b.end }];
    for (const h of cuts) {
      const next = [];
      for (const s of segments) {
        if (!intervalsOverlap(s.start, s.end, h.start, h.end)) {
          next.push(s);
          continue;
        }
        // left remainder: the part of s before the hole
        if (s.start < h.start) next.push({ start: s.start, end: h.start });
        // right remainder: the part of s after the hole
        if (h.end < s.end) next.push({ start: h.end, end: s.end });
      }
      segments = next.filter((x) => x.end > x.start);
    }
    out.push(...segments);
  }
  return mergeIntervals(out);
}
