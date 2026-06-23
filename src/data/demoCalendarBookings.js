// ============================================================================
// ⚠️  FAKE / DEMO DATA — THIS IS NOT REAL. ⚠️
// ============================================================================
// Every event produced by this file is hand-written DEMO data. It is NEVER
// fetched from Supabase, never written back, and never reaches a real student
// or teacher. Its ONLY purpose is to let us eyeball the teacher calendar's
// chips + popup cards across EVERY status while real bookings don't exist yet.
//
// HOW TO TURN IT ON (either works):
//   1. The orange perspective bar's "Sample data" checkbox (sets the shared
//      `breadyShowSampleData` flag — see src/lib/perspective.js). Reloads, then
//      these events appear. Toggling it OFF returns to real (empty/live) data.
//   2. add `?demo=1` to the calendar URL, e.g.
//      https://bready-calendar.vercel.app/TeacherCalendar?demo=1
// With BOTH off, the calendar shows ONLY real `get_my_bookings` data (currently
// empty) — so production users never see this.
//
// Every name/subject/description is prefixed "[DEMO]" so it is glaringly obvious
// in the chips, tooltips and popup cards that sample mode is active.
//
// WHY anchored to "today": rows are dated relative to `new Date()` so they always
// fall inside the month you're looking at (around now → June/July 2026).
//
// SAFE TO DELETE this whole file (and its import sites + the demo guard in
// bookingApi.js) once real data / Google Calendar sync exists.
// ============================================================================

import { mapBookingToEvent } from '@/lib/calendar/mapBookingToEvent';
import { isSampleData } from '@/lib/perspective';

// Tailwind chip colors per status (mirrors the calendar legend).
const TYPE_COLOR = {
  availability: 'bg-green-500',
  booked: 'bg-orange-500',
  completed: 'bg-gray-800',
  cancelled: 'bg-gray-600',
  waiting: 'bg-pink-200',
  synced: 'bg-blue-500',
  'not-reviewed': 'bg-red-500',
};

// Demo is ON when the URL carries `?demo=1` OR the shared "Sample data" toggle
// (orange perspective bar / admin "View as" menu) is on. Wrapped so it is safe
// in any (even non-browser) environment.
export function demoCalendarEnabled() {
  try {
    if (new URLSearchParams(window.location.search).get('demo') === '1') return true;
  } catch {
    /* no window (SSR/tests) */
  }
  return isSampleData();
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

// get_my_bookings-shaped FAKE rows for the statuses mapBookingToEvent supports
// (requested→waiting, confirmed→booked, completed→completed). Mapped through the
// SAME mapper the real pipeline uses, so what you see is exactly what a real row
// would produce.
function demoBookingRows(base) {
  const mk = (id, dayOffset, hour, durMin, status, role, who, subject, rate) => {
    const { start, end } = isoSpan(base, dayOffset, hour, durMin);
    return {
      id, // "demo-*" → never hits the DB (see bookingApi guard)
      status,
      viewer_role: role, // 'teacher' | 'student'
      start_time: start,
      end_time: end,
      student_name: role === 'teacher' ? `[DEMO] ${who}` : '[DEMO] You',
      tutor_name: role === 'student' ? `[DEMO] ${who}` : '[DEMO] You',
      subject: `[DEMO] ${subject}`,
      amount: rate * (durMin / 60),
      duration_hours: durMin / 60,
      hourly_rate: rate,
    };
  };
  return [
    // Waiting For Confirmation — teacher + student sides.
    mk('demo-waiting-t', 1, 10, 60, 'requested', 'teacher', 'Dana Demo', 'Mathematics', 120),
    mk('demo-waiting-s', 3, 16, 60, 'requested', 'student', 'Mr. Demo', 'English', 90),
    // Booked (confirmed) — teacher + student sides, June + July.
    mk('demo-booked-t', 2, 14, 60, 'confirmed', 'teacher', 'Omer Demo', 'Physics', 150),
    mk('demo-booked-s', 1, 12, 60, 'confirmed', 'student', 'Ms. Demo', 'Biology', 110),
    mk('demo-booked-t2', 18, 11, 90, 'confirmed', 'teacher', 'Noa Demo', 'Calculus', 130),
    // Completed — teacher + student sides (retrospective).
    mk('demo-completed-t', -1, 9, 60, 'completed', 'teacher', 'Lior Demo', 'Chemistry', 100),
    mk('demo-completed-s', -3, 15, 60, 'completed', 'student', 'Dr. Demo', 'History', 80),
  ];
}

// Calendar-event-shaped FAKE rows for statuses mapBookingToEvent does NOT map
// (availability, cancelled, not-reviewed) plus synced. Built directly in the
// event shape the grid + popup cards consume.
function directEvent(base, { id, dayOffset, time, type, role, who, subject }) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  const ev = {
    id,
    type,
    date: d.getDate(),
    year: d.getFullYear(),
    month: d.getMonth(),
    time,
    color: TYPE_COLOR[type] || 'bg-gray-400',
    description: `[DEMO] ${subject || type} — sample data, not real`,
  };
  if (role) ev.role = role;
  if (role === 'T') ev.student = `[DEMO] ${who || 'Student'}`;
  if (role === 'S') ev.teacher = `[DEMO] ${who || 'Teacher'}`;
  if (subject) ev.subject = `[DEMO] ${subject}`;
  return ev;
}

function demoDirectEvents(base) {
  return [
    // Availability — teacher opens slots (T) + a student study slot (S).
    directEvent(base, { id: 'demo-avail-t1', dayOffset: 1, time: '09:00 - 12:00', type: 'availability', role: 'T', subject: 'Open for booking' }),
    directEvent(base, { id: 'demo-avail-t2', dayOffset: 2, time: '13:00 - 15:00', type: 'availability', role: 'T', subject: 'Open for booking' }),
    directEvent(base, { id: 'demo-avail-s1', dayOffset: 2, time: '16:00 - 17:00', type: 'availability', role: 'S', subject: 'My study slot' }),
    directEvent(base, { id: 'demo-avail-t3', dayOffset: 20, time: '10:00 - 13:00', type: 'availability', role: 'T', subject: 'Open for booking' }),
    // Cancellation Fees — teacher + student sides.
    directEvent(base, { id: 'demo-cancelled-t', dayOffset: -2, time: '11:00 - 12:00', type: 'cancelled', role: 'T', who: 'Gil Demo', subject: 'Late cancellation' }),
    directEvent(base, { id: 'demo-cancelled-s', dayOffset: 5, time: '17:00 - 18:00', type: 'cancelled', role: 'S', who: 'Prof. Demo', subject: 'Cancelled lesson' }),
    // Not Reviewed — teacher + student sides.
    directEvent(base, { id: 'demo-notreviewed-t', dayOffset: -4, time: '10:00 - 11:00', type: 'not-reviewed', role: 'T', who: 'Sara Demo', subject: 'Awaiting review' }),
    directEvent(base, { id: 'demo-notreviewed-s', dayOffset: -1, time: '14:00 - 15:00', type: 'not-reviewed', role: 'S', who: 'Mr. Demo', subject: 'Awaiting review' }),
    // Synced (external Google-style) events — June + July, amber/blue overlap test.
    directEvent(base, { id: 'demo-synced-1', dayOffset: 2, time: '15:00 - 16:00', type: 'synced', subject: 'Mock Google Sync — overlaps an external event' }),
    directEvent(base, { id: 'demo-synced-2', dayOffset: 19, time: '18:00 - 19:30', type: 'synced', subject: 'Mock Google Sync — external event' }),
  ];
}

// The full set of FAKE calendar events, in the calendar's event shape, ready to
// spread alongside live events. `base` defaults to now (→ June/July 2026).
export function getDemoCalendarEvents(base = new Date()) {
  const fromBookings = demoBookingRows(base).map(mapBookingToEvent).filter(Boolean);
  return [...fromBookings, ...demoDirectEvents(base)];
}
