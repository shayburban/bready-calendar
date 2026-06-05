// Single source of truth for switching between the Monthly and Weekly
// teacher-calendar views. Imported by BOTH:
//
//   • the sidebar's view dropdown (CalendarSidebar.jsx —
//     `handleViewChange`), and
//   • the header dropdown in each calendar page
//     (TeacherCalendar.jsx + TeacherCalendarWeekly.jsx).
//
// Both call this exact function, so the two dropdowns now behave
// IDENTICALLY (mirrors the saikat reference where each `<select>`
// just sets `window.document.location.href`). Keeping the logic in
// one place also means future changes (e.g. swapping `window.location`
// for `useNavigate`, or adding analytics) happen in exactly one spot.
//
// The function is intentionally a void-returning navigation side
// effect — callers are still expected to call their local `setView`
// to keep React state in sync for the frames between selection and
// the page reload (harmless once the new page mounts fresh).

import { createPageUrl } from '@/utils';

export function goToCalendarView(newView) {
  if (newView === 'Month') {
    window.location.href = createPageUrl('TeacherCalendar');
  } else if (newView === 'Week') {
    window.location.href = createPageUrl('TeacherCalendarWeekly');
  }
}
