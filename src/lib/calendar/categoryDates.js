// Per-category (type + role) date math for the popup cards' contextual date
// dropdown.
//
//   categoryDatesForPicker → the set of dates that HAVE an event of a given
//     type+role, so CalendarWithinCalendarCards can enable exactly those and
//     disable the rest. Availability (role 'T') is backed by the teacher's real
//     saved slots; every other type is backed by the master calendar events.
//     Month-agnostic events (no explicit year/month) are materialized on their
//     day-of-month across a navigable month window.
//
//   eventsForDate → the matching events on one specific date, used by the host
//     modal to RE-HYDRATE the card when a new date is picked.
//
// Pure + dependency-light so it is straightforward to unit test.

import { synthesizeSavedAvailEvent } from '@/lib/eventSiblings';

const isoLocal = (y, mIdx, d) => new Date(y, mIdx, d).toISOString();
const daysInMonth = (y, mIdx) => new Date(y, mIdx + 1, 0).getDate();
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Dates (ISO strings, local-midnight) that contain at least one event of the
// given type+role. `center` anchors the materialization window for month-
// agnostic events; the window spans [center - monthsBack, center + monthsFwd].
export const categoryDatesForPicker = ({
  events = [],
  savedSlots = [],
  type,
  role,
  center = new Date(),
  monthsBack = 1,
  monthsFwd = 13,
}) => {
  const set = new Set();
  const c = center instanceof Date ? center : new Date(center);
  const baseY = Number.isNaN(c.getTime()) ? new Date().getFullYear() : c.getFullYear();
  const baseM = Number.isNaN(c.getTime()) ? new Date().getMonth() : c.getMonth();

  // Availability (role 'T') is backed by real saved slots → exact dates.
  if (type === 'availability' && role === 'T') {
    (savedSlots || []).forEach((s) => {
      if (!s || typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) return;
      const [y, m, d] = s.date.split('-').map(Number);
      set.add(isoLocal(y, m - 1, d));
    });
  }

  // Master events of the matching type+role, materialized across the window.
  const matching = (events || []).filter((e) => e && e.type === type && e.role === role);
  if (matching.length) {
    for (let off = -monthsBack; off <= monthsFwd; off++) {
      const d0 = new Date(baseY, baseM + off, 1);
      const y = d0.getFullYear();
      const mIdx = d0.getMonth();
      matching.forEach((e) => {
        if (e.year != null && e.year !== y) return;
        if (e.month != null && e.month !== mIdx) return;
        const day = Number(e.date);
        if (!Number.isInteger(day) || day < 1) return;
        set.add(isoLocal(y, mIdx, Math.min(day, daysInMonth(y, mIdx))));
      });
    }
  }

  return [...set];
};

// Matching events on a single date — sibling-shaped, carrying the picked
// `dateString`. Used by the host modal to re-hydrate the card.
export const eventsForDate = ({ events = [], savedSlots = [], type, role, dateISO }) => {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return [];

  if (type === 'availability' && role === 'T') {
    const key = ymd(d);
    return (savedSlots || [])
      .filter((s) => s && s.date === key && s.startTime && s.endTime)
      .slice()
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
      .map((s, idx) => synthesizeSavedAvailEvent(s, d.getDate(), dateISO, idx));
  }

  const day = d.getDate();
  return (events || [])
    .filter(
      (e) =>
        e &&
        e.type === type &&
        e.role === role &&
        Number(e.date) === day &&
        (e.year == null || e.year === d.getFullYear()) &&
        (e.month == null || e.month === d.getMonth())
    )
    .map((e) => ({ ...e, dateString: dateISO }));
};
