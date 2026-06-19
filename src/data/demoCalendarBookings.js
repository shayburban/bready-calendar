// ============================================================================
// ⚠️  FAKE / DEMO DATA — THIS IS NOT REAL. ⚠️
// ============================================================================
// Every booking produced by this file is hand-written DEMO data. It is NEVER
// fetched from Supabase, never written back, and never reaches a real student
// or teacher. Its ONLY purpose is to let us eyeball the teacher calendar's
// chips + popup cards (Waiting For Confirmation / Booked / Completed) and
// confirm they render correctly while real bookings don't exist yet.
//
// HOW TO TURN IT ON:  add `?demo=1` to the calendar URL, e.g.
//   https://bready-calendar.vercel.app/TeacherCalendar?demo=1
//   https://bready-calendar.vercel.app/TeacherCalendarWeekly?demo=1
// With NO `?demo=1`, the calendar shows ONLY real `get_my_bookings` data
// (which is currently empty) — so production users never see this.
//
// WHY anchored to "today": the rows are dated relative to `new Date()` so they
// always fall inside the current month/week you're looking at, regardless of
// when you open the page.
//
// NOTES / KNOWN DEMO BEHAVIOUR:
//  • The Waiting card's Approve/Reject buttons are wired to the real RPC seam,
//    but `respondBookingRequest` short-circuits any id starting with "demo-"
//    (see src/lib/scheduling/bookingApi.js) so it returns success WITHOUT
//    touching the database. After the refresh the demo card reappears (the
//    list is regenerated each load) — expected, because nothing was persisted.
//  • The single demo "synced" event exists so you can see the synced-overlap
//    warning fire on REAL data: open availability over that day/time and the
//    sidebar will (correctly) warn. With demo off there are no synced events,
//    so the warning never fires spuriously.
//
// SAFE TO DELETE this whole file (and its two import sites + the demo guard in
// bookingApi.js) once real data / Google Calendar sync exists.
// ============================================================================

import { mapBookingToEvent } from '@/lib/calendar/mapBookingToEvent';

// True only when the page URL carries `?demo=1`. Wrapped in try/catch so it is
// safe in any (even non-browser) environment.
export function demoCalendarEnabled() {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}

// Build an ISO start/end pair `dayOffset` days from `base`, at the given local
// wall-clock hour. mapBookingToEvent re-reads these with local getHours(), so
// the round-trip keeps the same wall-clock time we set here.
function isoSpan(base, dayOffset, hour, durationMin) {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + durationMin * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}

// get_my_bookings-shaped FAKE rows. Mapped through the SAME mapBookingToEvent
// the real pipeline uses, so what you see is exactly what a real row would
// produce. Covers each rendered status × both viewer roles.
function demoBookingRows(base) {
  const mk = (id, dayOffset, hour, durMin, status, role, who, subject, rate) => {
    const { start, end } = isoSpan(base, dayOffset, hour, durMin);
    return {
      id, // "demo-*" → never hits the DB (see bookingApi guard)
      status,
      viewer_role: role, // 'teacher' | 'student'
      start_time: start,
      end_time: end,
      student_name: role === 'teacher' ? who : 'You (demo)',
      tutor_name: role === 'student' ? who : 'You (demo)',
      subject,
      amount: rate * (durMin / 60),
      duration_hours: durMin / 60,
      hourly_rate: rate,
    };
  };
  return [
    // The headline card: Waiting For Confirmation (T) → "Proposed Booking".
    mk('demo-waiting-t', 1, 10, 60, 'requested', 'teacher', 'Dana Demo (fake)', 'Mathematics', 120),
    // Confirmed lesson as teacher → Booked (T).
    mk('demo-booked-t', 2, 14, 60, 'confirmed', 'teacher', 'Omer Demo (fake)', 'Physics', 150),
    // Completed lesson as teacher → Completed (T).
    mk('demo-completed-t', -1, 9, 60, 'completed', 'teacher', 'Lior Demo (fake)', 'Chemistry', 100),
    // Waiting as student (S) → the S-side Waiting card.
    mk('demo-waiting-s', 3, 16, 60, 'requested', 'student', 'Mr. Demo (fake)', 'English', 90),
    // Confirmed lesson as student → Booked (S).
    mk('demo-booked-s', 1, 12, 60, 'confirmed', 'student', 'Ms. Demo (fake)', 'Biology', 110),
  ];
}

// One FAKE "synced" Google-Calendar-style event (event shape; mapBookingToEvent
// only maps bookings, so this is built directly). Lets you watch the
// synced-overlap warning behave on real data instead of phantom collisions.
function demoSyncedEvent(base) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2); // same day as demo-booked-t
  return {
    id: 'demo-synced-1',
    type: 'synced',
    color: 'bg-blue-500',
    date: d.getDate(),
    year: d.getFullYear(),
    month: d.getMonth(),
    time: '15:00 - 16:00',
    description: 'Demo synced Google Calendar event (fake)',
  };
}

// The full set of FAKE calendar events, in the calendar's event shape, ready to
// spread alongside live events. `base` defaults to now.
export function getDemoCalendarEvents(base = new Date()) {
  const fromBookings = demoBookingRows(base).map(mapBookingToEvent).filter(Boolean);
  return [...fromBookings, demoSyncedEvent(base)];
}
