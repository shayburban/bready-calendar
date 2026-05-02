// Shared persistence + merge logic for teacher availability slots.
// Backed by localStorage so the Monthly and Weekly calendar pages
// (which navigate via window.location and remount fully) read/write
// the same canonical slot list. Acts as the frontend stand-in for the
// real backend described in docs/availability-merge-architecture.md —
// when the backend lands, swap the load/save bodies for fetch calls
// and keep the merge helpers exactly as-is.

const STORAGE_KEY = 'bready.teacherAvailabilitySlots.v1';

// v6 — collapse overlapping/touching slots on the same date to a single
// canonical interval. Date-only entries (closed-mode wildcards) pass
// through. Sort by startTime, then fold when next.start <= prev.end.
export const mergeSlotsByDate = (slots) => {
  const buckets = new Map();
  const passthrough = [];
  slots.forEach((s) => {
    if (!s.startTime || !s.endTime) {
      passthrough.push(s);
      return;
    }
    if (!buckets.has(s.date)) buckets.set(s.date, []);
    buckets.get(s.date).push(s);
  });
  const merged = [];
  buckets.forEach((rows, date) => {
    const sorted = [...rows].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    sorted.forEach((row) => {
      const last = merged[merged.length - 1];
      if (last && last.date === date && row.startTime <= last.endTime) {
        if (row.endTime > last.endTime) last.endTime = row.endTime;
      } else {
        merged.push({ date, startTime: row.startTime, endTime: row.endTime });
      }
    });
  });
  return [...merged, ...passthrough];
};

// v7 — subtract a closed [closedStart, closedEnd] from an open slot,
// returning 0, 1, or 2 surviving sub-slots.
export const subtractInterval = (open, closedStart, closedEnd) => {
  if (closedEnd <= open.startTime || closedStart >= open.endTime) {
    return [open];
  }
  const pieces = [];
  if (closedStart > open.startTime) {
    pieces.push({ ...open, endTime: closedStart });
  }
  if (closedEnd < open.endTime) {
    pieces.push({ ...open, startTime: closedEnd });
  }
  return pieces;
};

// Pure save reducer — given (existingSlots, newSlots, mode) returns the
// next canonical slot list. Used by both Monthly and Weekly handlers.
export const applySaveAvailability = (prev, slots, mode) => {
  if (mode === 'open') {
    const key = (s) => `${s.date}|${s.startTime}|${s.endTime}`;
    const map = new Map(prev.map((s) => [key(s), s]));
    slots.forEach((s) => map.set(key(s), s));
    return mergeSlotsByDate(Array.from(map.values()));
  }
  let remaining = [...prev];
  slots.forEach((closedSlot) => {
    if (closedSlot.startTime === undefined) {
      remaining = remaining.filter((s) => s.date !== closedSlot.date);
      return;
    }
    remaining = remaining.flatMap((open) => {
      if (open.date !== closedSlot.date) return [open];
      if (!open.startTime || !open.endTime) return [open];
      return subtractInterval(open, closedSlot.startTime, closedSlot.endTime);
    });
  });
  return mergeSlotsByDate(remaining);
};

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const loadAvailabilitySlots = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return safeParse(raw);
};

export const persistAvailabilitySlots = (slots) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
};

export const AVAILABILITY_STORAGE_KEY = STORAGE_KEY;
