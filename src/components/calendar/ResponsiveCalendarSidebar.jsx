// Responsive wrapper for CalendarSidebar — adds a small-screen
// off-canvas drawer pattern WITHOUT touching CalendarSidebar internals.
// Mirrors the saikat reference design
// (Bready/html/teacher_calender_week.html line ~7741):
//
//   <button data-bs-toggle="offcanvas" data-bs-target="#calCtrlLft">
//     <img src="images/spanner.png" />
//   </button>
//   <div class="offcanvas offcanvas-start" id="calCtrlLft"> … </div>
//
// • lg+ (≥1024px) — renders <CalendarSidebar /> inline (existing
//   side-by-side layout, unchanged).
// • <lg (<1024px) — renders a thin "Calendar Controls" bar with a
//   wrench icon. Tapping the bar opens a left-side Sheet
//   (shadcn / Radix Dialog under the hood) that mounts the same
//   <CalendarSidebar /> inside the drawer body. The Sheet primitive
//   provides a built-in `bg-black/80` overlay that dims the rest of
//   the page, focusing the user on the controls. The drawer slides
//   in from the left, has a built-in close (X) button at top-right,
//   and dismisses on click-outside or Escape.
//
// IMPORTANT — preserves all existing functionality:
//   • CalendarSidebar's internal save logic, dirty/cancel tracking,
//     Pencil edit toggle, dynamic validation flow, baseline revert
//     invariant, and three scheduling-preference rows are untouched.
//   • The calendar's responsive grid wrappers on the host page are
//     not modified.
//   • All props are forwarded verbatim.
//   • Only ONE CalendarSidebar instance is mounted at a time
//     (chosen by matchMedia) — no duplicate TeacherProfile.filter
//     calls, no duplicate storage-event listeners, no risk of
//     drifted internal state between viewport sizes.

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Wrench } from 'lucide-react';
import CalendarSidebar from './CalendarSidebar';

// Local helper — tiny matchMedia hook. Inlined here so this wrapper
// does not add a new shared dependency. Initial state reads
// synchronously so the first paint already reflects the correct
// breakpoint (no flicker between the bar and the inline sidebar).
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    // Modern addEventListener — Safari ≥14, all evergreens.
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export default function ResponsiveCalendarSidebar(props) {
  // Tailwind's lg breakpoint is 1024px. Match it exactly so the
  // wrapper switches modes on the same boundary as the host page's
  // `lg:flex-row` layout rules.
  const isLg = useMediaQuery('(min-width: 1024px)');
  const [open, setOpen] = useState(false);

  // Desktop / wide layout — render the original sidebar as the flex
  // child. The inner <aside> still carries `w-full lg:w-[340px]
  // flex-shrink-0`, so the existing layout is byte-for-byte
  // identical at lg+.
  if (isLg) {
    return <CalendarSidebar {...props} />;
  }

  // Small-screen layout — compact bar + left-side drawer.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open calendar controls"
        aria-expanded={open}
        className="w-full flex items-center justify-between bg-white border rounded-lg shadow-sm px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">
          Calendar Controls
        </span>
        <Wrench className="w-5 h-5 text-gray-600" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* w-[92vw] max-w-md overrides the Sheet default `w-3/4
            sm:max-w-sm` so the existing 340px sidebar column has
            comfortable breathing room on phones AND on tablets,
            without overrunning very wide phones. p-0 lets the inner
            padding wrapper own spacing. overflow-y-auto turns the
            drawer into its own scroll container so the
            CalendarSidebar's long content (Legend / Set Availability
            / Scheduling Preferences card) is fully reachable on
            short screens. */}
        <SheetContent
          side="left"
          className="w-[92vw] max-w-md sm:max-w-md p-0 overflow-y-auto"
        >
          {/* pt-12 reserves vertical space for the Sheet's built-in
              absolute close button (right-4 top-4) so it never
              overlaps the sidebar's "Teacher Calendar" heading. */}
          <div className="p-4 pt-12">
            <CalendarSidebar {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
