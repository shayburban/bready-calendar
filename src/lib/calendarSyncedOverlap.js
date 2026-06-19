// Calendar synced-events overlap helpers (teacher-only, planes P3/P4, R14–R15).
//
// PURE annotation logic shared by the monthly + weekly teacher calendars AND the
// Set Availability sidebar's pre-save warning. Synced calendar events NEVER take
// part in bookability (R14): they are not an input to EffectiveBookable or any
// write checkpoint — these helpers only DESCRIBE same-day wall-clock overlaps so
// the teacher's UI can warn in yellow. Nothing is stored, so an external move /
// delete clears the warning on the next render. Synced event NAMES are
// teacher-only (R15g); the public surface must never import this module.
//
// Times are same-day wall-clock minutes (tz-free) — sufficient for a purely
// VISUAL annotation because both sides of every comparison sit on the same
// rendered day. Bookability stays on absolute UTC instants (R24), elsewhere.

import { parseWallRange, intervalsOverlap, syncedStripes } from '@/lib/scheduling/syncedOverlap';

// sample-event type -> the synced-striping "kind" (R15b). Only availability,
// booked and (waiting=)pending blocks are annotated; completed / cancelled /
// not-reviewed are retrospective and cast no bookable time.
export const SYNCED_BLOCK_KIND = { availability: 'availability', booked: 'booked', waiting: 'pending' };

// Per-day yellow note: Map<blockId, Set<eventName>> for the chips that overlap a
// synced event that day, or null when there is nothing to flag (R15b).
export const syncedNoteForDay = (dayEvents) => {
  const toInterval = (e, extra) => {
    const r = parseWallRange(e.time);
    if (!r) return null;
    return { id: e.id ?? null, start: r.start, end: r.end, ...extra };
  };
  const synced = dayEvents
    .filter((e) => e.type === 'synced')
    .map((e) => toInterval(e, { name: e.description || 'Synced calendar event' }))
    .filter(Boolean);
  if (synced.length === 0) return null;
  const blocks = dayEvents
    .filter((e) => SYNCED_BLOCK_KIND[e.type])
    .map((e) => toInterval(e, { kind: SYNCED_BLOCK_KIND[e.type] }))
    .filter(Boolean);
  if (blocks.length === 0) return null;
  const byBlock = new Map();
  for (const s of syncedStripes(synced, blocks)) {
    if (s.blockId == null) continue;
    if (!byBlock.has(s.blockId)) byBlock.set(s.blockId, new Set());
    if (s.eventName) byBlock.get(s.blockId).add(s.eventName);
  }
  return byBlock.size > 0 ? byBlock : null;
};

// Pre-save check (R15a / Phase 1): the synced events a set of to-be-opened
// availability slots would overlap, as [{ name, range }] (deduped).
//
// `syncedEvents` are the host calendar's LIVE synced events (type === 'synced')
// — injected by the caller, NOT read from the mock file. Each carries the
// calendar's event shape: { type, date (day-of-month), year, month, time }.
// Matching is date-EXACT (year + month + day) when those fields are present, so
// a June availability range can never collide with some other month's synced
// event that merely shares a day-of-month (the old bug). When Google Calendar
// sync doesn't exist yet, callers pass [] → this returns [] (no false warning).
//
// Partial-day ranges are handled by intervalsOverlap (half-open), so e.g.
// 14:45–16:30 correctly overlaps a 16:00–17:00 synced event.
export const syncedOverlapsForSlots = (slots, syncedEvents = []) => {
  if (!Array.isArray(slots) || !Array.isArray(syncedEvents)) return [];
  const synced = syncedEvents.filter((e) => e && e.type === 'synced');
  if (synced.length === 0) return [];
  const out = [];
  const seen = new Set();
  for (const slot of slots) {
    if (!slot || !slot.date || !slot.startTime || !slot.endTime) continue;
    const [yStr, mStr, dStr] = String(slot.date).split('-');
    const slotYear = Number(yStr);
    const slotMonth0 = Number(mStr) - 1; // 'YYYY-MM-DD' month is 1-based; events are 0-based
    const slotDom = Number(dStr);
    const slotRange = parseWallRange(`${slot.startTime} - ${slot.endTime}`);
    if (!slotRange) continue;
    for (const ev of synced) {
      // Date-exact match; year/month fall back to "any" only for legacy events
      // that predate the {year, month} fields (none in live data).
      const sameDay =
        ev.date === slotDom &&
        (ev.year == null || ev.year === slotYear) &&
        (ev.month == null || ev.month === slotMonth0);
      if (!sameDay) continue;
      const evRange = parseWallRange(ev.time);
      if (!evRange) continue;
      if (intervalsOverlap(slotRange.start, slotRange.end, evRange.start, evRange.end) && !seen.has(ev.id)) {
        seen.add(ev.id);
        out.push({ name: ev.description || 'Synced calendar event', range: ev.time });
      }
    }
  }
  return out;
};
