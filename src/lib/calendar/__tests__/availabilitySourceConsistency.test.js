// Cross-source consistency for the popup cards' contextual date dropdowns.
//
// The user's question: when availability is created from DIFFERENT places in the
// app (the sidebar "Set Availability (T)" tab vs. the "Add New Booking Or
// Availability" popup), do its dates show up the SAME in the date dropdowns of
// the matching type+role popup cards? And is the S/T split respected?
//
// This exercises the REAL data path end-to-end:
//   AddNew popup : expandRepeatDates → slots → applySaveAvailability → store
//   sidebar      : buildSlots ({date:'YYYY-MM-DD',...}) → applySaveAvailability
//   dropdown     : categoryDatesForPicker(store, type, role)  (what the cards read)
// Both creation paths funnel through the same handleSaveAvailability →
// savedAvailabilitySlots store, so the dropdown must see them identically.

import { describe, it, expect } from 'vitest';
import { expandRepeatDates } from '@/lib/calendar/repeatDates';
import { applySaveAvailability } from '@/lib/availabilityStore';
import { categoryDatesForPicker } from '@/lib/calendar/categoryDates';

const hasDate = (isoList, y, mIdx, d) =>
  isoList.some((iso) => {
    const x = new Date(iso);
    return x.getFullYear() === y && x.getMonth() === mIdx && x.getDate() === d;
  });

// Master events shaped like sampleEvents: availability T + S (day 19) and a
// booked:T (day 19) — month-agnostic day-of-month templates.
const masterEvents = [
  { id: 1, date: 19, type: 'availability', role: 'T' },
  { id: 2, date: 19, type: 'availability', role: 'S' },
  { id: 3, date: 19, type: 'booked', role: 'T' },
];
const CENTER = new Date(2026, 6, 1); // July 2026, so day 19 materializes in-window

describe('date dropdowns are consistent regardless of where the event was added', () => {
  it('availability created via the AddNew "Open New Availability (T)" path appears in the (T) dropdown', () => {
    const dates = expandRepeatDates({ startDate: new Date(2026, 6, 10), weekdays: [], repeatWeeks: 0 });
    const slots = dates.map((d) => ({ date: d, startTime: '09:00', endTime: '10:00' }));
    const saved = applySaveAvailability([], slots, 'open');
    const dropdown = categoryDatesForPicker({
      events: masterEvents, savedSlots: saved, type: 'availability', role: 'T', center: CENTER,
    });
    expect(hasDate(dropdown, 2026, 6, 10)).toBe(true); // July 10 is enabled
  });

  it('availability created via the sidebar path appears in the (T) dropdown', () => {
    const sidebarSlots = [{ date: '2026-07-10', startTime: '09:00', endTime: '10:00' }];
    const saved = applySaveAvailability([], sidebarSlots, 'open');
    const dropdown = categoryDatesForPicker({
      events: masterEvents, savedSlots: saved, type: 'availability', role: 'T', center: CENTER,
    });
    expect(hasDate(dropdown, 2026, 6, 10)).toBe(true);
  });

  it('the two creation sources yield IDENTICAL dropdown dates (location-independent)', () => {
    const addNewSaved = applySaveAvailability(
      [],
      expandRepeatDates({ startDate: new Date(2026, 6, 10), weekdays: [], repeatWeeks: 0 })
        .map((d) => ({ date: d, startTime: '09:00', endTime: '10:00' })),
      'open'
    );
    const sidebarSaved = applySaveAvailability(
      [], [{ date: '2026-07-10', startTime: '09:00', endTime: '10:00' }], 'open'
    );
    const a = categoryDatesForPicker({ events: masterEvents, savedSlots: addNewSaved, type: 'availability', role: 'T', center: CENTER }).sort();
    const b = categoryDatesForPicker({ events: masterEvents, savedSlots: sidebarSaved, type: 'availability', role: 'T', center: CENTER }).sort();
    expect(a).toEqual(b);
  });

  it('the (T) dropdown also still includes the sample availability:T dates (saved + master merged)', () => {
    const saved = applySaveAvailability([], [{ date: '2026-07-10', startTime: '09:00', endTime: '10:00' }], 'open');
    const dropdown = categoryDatesForPicker({ events: masterEvents, savedSlots: saved, type: 'availability', role: 'T', center: CENTER });
    expect(hasDate(dropdown, 2026, 6, 10)).toBe(true); // saved (real) slot
    expect(hasDate(dropdown, 2026, 6, 19)).toBe(true); // sample availability:T (day 19)
  });

  it('S/T split: teacher-created availability (T) does NOT leak into the (S) dropdown', () => {
    const saved = applySaveAvailability([], [{ date: '2026-07-10', startTime: '09:00', endTime: '10:00' }], 'open');
    const sDropdown = categoryDatesForPicker({ events: masterEvents, savedSlots: saved, type: 'availability', role: 'S', center: CENTER });
    expect(hasDate(sDropdown, 2026, 6, 10)).toBe(false); // the (T) slot is not in the (S) dropdown
    expect(hasDate(sDropdown, 2026, 6, 19)).toBe(true);  // sample availability:S (day 19) is
  });

  it('type split: a saved availability slot does NOT appear in the booked dropdown', () => {
    const saved = applySaveAvailability([], [{ date: '2026-07-10', startTime: '09:00', endTime: '10:00' }], 'open');
    const bookedDropdown = categoryDatesForPicker({ events: masterEvents, savedSlots: saved, type: 'booked', role: 'T', center: CENTER });
    expect(hasDate(bookedDropdown, 2026, 6, 10)).toBe(false); // availability slot excluded
    expect(hasDate(bookedDropdown, 2026, 6, 19)).toBe(true);  // booked:T sample (day 19)
  });
});
