// Live "bookable window" for an availability slot — the display-layer companion
// to the UTC booking engine (lib/scheduling/effectiveBookable + offers).
//
// A stored availability slot [startTime, endTime] on a given date is the
// teacher's FIXED commitment. As the clock advances, the slot stays the same
// but the part that is still bookable shrinks from the FRONT only:
//
//   effectiveStart = max(slotStart, now + minimum-notice)   (snapped up to the
//                                                             15-minute grid)
//   end stays pinned at endTime
//
// So the teacher should keep seeing the original range (with the elapsed part
// marked), while a student should only be shown [effectiveStart, end]. This is
// a pure, local-time helper (the cards work in 'HH:MM' + a calendar date), kept
// deliberately small and dependency-free so it is trivially testable. The
// authoritative bookability check still lives in the UTC engine; this only
// drives what the popup cards render.

const GRID_MIN = 15;

// 'HH:MM' -> minutes-of-day, or null when unparseable.
export const parseHHMM = (t) => {
  if (typeof t !== 'string') return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

// minutes-of-day -> 'HH:MM'.
export const formatHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// "06:30 - 19:30" / "06:30 – 19:30" -> { startTime, endTime } or null. Accepts
// hyphen, en-dash, or em-dash separators (the cards mix these).
export const parseTimeRange = (str) => {
  if (typeof str !== 'string') return null;
  const parts = str.split(/\s*[-–—]\s*/);
  if (parts.length < 2) return null;
  const startTime = parts[0].trim();
  const endTime = parts[1].trim();
  if (parseHHMM(startTime) == null || parseHHMM(endTime) == null) return null;
  return { startTime, endTime };
};

// Compact human duration: 135 -> "2h 15m", 60 -> "1h", 45 -> "45m", 0 -> "0m".
export const formatRemaining = (mins) => {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h}h ${r}m`;
  if (h) return `${h}h`;
  return `${r}m`;
};

const ceilTo = (n, step) => Math.ceil(n / step) * step;

// -1 if day(a) < day(b), 0 same calendar day, 1 if after. Compares LOCAL dates.
const compareDay = (a, b) => {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return da < db ? -1 : da > db ? 1 : 0;
};

// computeBookableWindow — derive the live bookable window for a slot.
//
// params:
//   date          : Date | ISO/parsable string — the slot's calendar day
//   startTime     : 'HH:MM' — the slot's stored start
//   endTime       : 'HH:MM' — the slot's stored end
//   noticeMinutes : minimum-notice (L) in minutes; defaults to 0 (the platform
//                   default — advance booking now defaults to no notice). When a
//                   teacher's notice is known it can be threaded in here.
//   now           : Date — injectable for testing; defaults to the live clock.
//
// returns:
//   { valid:false }                                  when inputs are unparseable
//   { valid:true, state, originalStart, originalEnd,
//     effectiveStart, isPartlyElapsed, remainingMinutes }
//
//   state           : 'upcoming' (not started) | 'live' (in progress, still
//                     bookable) | 'ended' (no bookable time left)
//   effectiveStart  : the rolled-forward, grid-snapped front edge ('HH:MM'),
//                     or null when ended
//   isPartlyElapsed : true only while live AND some of the slot has passed
//   remainingMinutes: minutes from effectiveStart to end (0 when ended)
export const computeBookableWindow = ({
  date,
  startTime,
  endTime,
  noticeMinutes = 0,
  now = new Date(),
} = {}) => {
  const startMin = parseHHMM(startTime);
  const endMin = parseHHMM(endTime);
  if (startMin == null || endMin == null || endMin <= startMin || date == null) {
    return { valid: false };
  }
  const slotDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(slotDate.getTime())) return { valid: false };

  const originalStart = formatHHMM(startMin);
  const originalEnd = formatHHMM(endMin);
  const fullDuration = endMin - startMin;

  const cmp = compareDay(slotDate, now);

  // A future day: the whole slot is still ahead — fully bookable from its start.
  if (cmp > 0) {
    return {
      valid: true,
      state: 'upcoming',
      originalStart,
      originalEnd,
      effectiveStart: originalStart,
      isPartlyElapsed: false,
      remainingMinutes: fullDuration,
    };
  }
  // A past day: nothing left.
  if (cmp < 0) {
    return {
      valid: true,
      state: 'ended',
      originalStart,
      originalEnd,
      effectiveStart: null,
      isPartlyElapsed: false,
      remainingMinutes: 0,
    };
  }

  // Same day — roll the front edge to max(slotStart, now + notice), snapped up
  // to the next 15-minute grid boundary (students can only book on the grid).
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const frontMin = nowMin + Math.max(0, noticeMinutes);
  const effMin = ceilTo(Math.max(startMin, frontMin), GRID_MIN);

  if (effMin >= endMin) {
    return {
      valid: true,
      state: 'ended',
      originalStart,
      originalEnd,
      effectiveStart: null,
      isPartlyElapsed: false,
      remainingMinutes: 0,
    };
  }

  const isPartlyElapsed = effMin > startMin;
  return {
    valid: true,
    state: isPartlyElapsed ? 'live' : 'upcoming',
    originalStart,
    originalEnd,
    effectiveStart: formatHHMM(effMin),
    isPartlyElapsed,
    remainingMinutes: endMin - effMin,
  };
};
