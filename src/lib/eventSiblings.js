// Build sibling-event lists for the dynamic time-slot tab header in
// EventModal/AvailabilityModal. Two events are siblings when they share
// the same calendar day, the same `type`, and the same `role`.
//
// Inputs:
//   - clicked: the event the user clicked (carries `type`, `role`, `date`)
//   - dayEvents: every event on the same day (sample + saved availability,
//                already filtered to that cell by the caller).
//
// Output: the dayEvents array minus `clicked` (matched by id when present,
// otherwise by `time` string), restricted to identical type+role.
export const computeSiblingEvents = (clicked, dayEvents) => {
  if (!clicked) return [];
  return dayEvents.filter((e) => {
    if (e === clicked) return false;
    if (e.id && clicked.id && e.id === clicked.id) return false;
    if (!e.id && !clicked.id && e.time === clicked.time) return false;
    return e.type === clicked.type && e.role === clicked.role;
  });
};

// Synthesize an "availability" event from a saved-availability slot so
// sibling logic can treat saved slots and sample events uniformly. Mirrors
// the synthesis already done by the Monthly/Weekly grids.
export const synthesizeSavedAvailEvent = (slot, dayOfMonth, dateString, idx) => ({
  id: `saved-avail-${slot.date}-${slot.startTime}-${slot.endTime}-${idx}`,
  type: 'availability',
  role: 'T',
  date: dayOfMonth,
  time: `${slot.startTime} - ${slot.endTime}`,
  dateString,
});

// Day-of-month derived from a saved slot's `YYYY-MM-DD` date. Returns null
// if the date string can't be parsed.
export const dayOfMonthFromSlot = (slot) => {
  if (!slot?.date) return null;
  const m = slot.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return parseInt(m[3], 10);
};
