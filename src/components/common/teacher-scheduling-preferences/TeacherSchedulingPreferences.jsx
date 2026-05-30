// Shared composite of the three Page-5c scheduling controls
// (Availability Window, How far in advance, Break after a class). Page 5c
// — `Step5cAvailability` → `TeacherCalendarMain` → `BookingPreferences` —
// renders its own wrappers around the same three common selectors today;
// this component is the new shared blueprint so the Calendar Sidebar can
// mount the EXACT same fields, dropdown options, placeholder text, and
// tooltip copy. The backend schema mirrors what TeacherForm persists to
// TeacherProfile:
//
//   {
//     availability_window:      { preference, preferenceType },
//     advance_booking_policy:   { preference, preferenceType },
//     break_after_class_hours:  { preference, preferenceType },
//   }
//
// Heading typography is variant-driven:
//   • variant="page"     — text-lg font-medium text-gray-900 (matches Page 5c).
//   • variant="sidebar"  — text-sm font-bold text-gray-800  (matches the
//                          existing CalendarSidebar headings).
//
// The wrapped common selectors already render their own h4 + Info tooltip.
// We pass `hideHeading` and render an external heading with the right
// variant typography so the visible label/tooltip copy stays IDENTICAL to
// Page 5c while typography matches whichever surface mounted us.

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import CommonAvailabilityWindow from '@/components/common/AvailabilityWindow';
import AdvanceBookingSelector from '@/components/common/AdvanceBookingSelector';
import BreakTimeSelector from '@/components/common/BreakTimeSelector';

// Tooltip copy — VERBATIM from Page 5c (see
// teacher-registration/teacher-calendar/AvailabilityWindow.jsx and the
// built-in headings inside AdvanceBookingSelector / BreakTimeSelector).
const TOOLTIP_AVAILABILITY_WINDOW = 'How far in the future can students book with you?';
const TOOLTIP_ADVANCE_BOOKING = 'Minimum time required before a lesson can be booked';
const TOOLTIP_BREAK = 'Buffer time between consecutive lessons';

const HeadingWithTooltip = ({ title, tooltip, variant }) => {
  const headingClass =
    variant === 'sidebar'
      ? 'text-sm font-bold text-gray-800'
      : 'text-lg font-medium text-gray-900';
  return (
    <div className="flex items-center gap-2">
      <h4 className={headingClass}>{title}</h4>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="p-0 bg-transparent border-none" aria-label="More info">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-black text-white text-xs rounded-md shadow-lg p-2">
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

const EMPTY_FIELD = { preference: null, preferenceType: null };

// Schema matches TeacherProfile field names — see TeacherForm.jsx where
// Page 5c writes `availability_window`, `advance_booking_policy`, and
// `break_after_class_hours` directly. Reading from / writing to the same
// keys is what makes "Page 5c is the single source of truth" hold.
//
// Props:
//   value     — { availability_window, advance_booking_policy, break_after_class_hours }
//   onChange  — (next) => void.  Called with the full merged value any time
//               a field updates.
//   variant   — 'sidebar' | 'page'.  Heading typography only — fields and
//               dropdown options are identical across variants.
//   disabled  — when true, every dropdown is gated (e.g. while the Pencil
//               edit-mode is off in the sidebar).
//   className — appended to the root wrapper for layout overrides.
export default function TeacherSchedulingPreferences({
  value,
  onChange,
  variant = 'page',
  disabled = false,
  className = '',
}) {
  const current = value || {};
  const emit = (patch) => {
    if (typeof onChange !== 'function') return;
    onChange({ ...current, ...patch });
  };

  // Spacing between sections matches each surface:
  //   sidebar  → tight space-y-4 to mirror the existing CalendarSidebar.
  //   page     → space-y-8 to match BookingPreferences on Page 5c.
  const spacing = variant === 'sidebar' ? 'space-y-4' : 'space-y-8';

  return (
    <div className={`${spacing} ${className}`}>
      <div className="space-y-2">
        <HeadingWithTooltip
          title="Availability Window"
          tooltip={TOOLTIP_AVAILABILITY_WINDOW}
          variant={variant}
        />
        <CommonAvailabilityWindow
          value={current.availability_window || EMPTY_FIELD}
          onChange={(next) => emit({ availability_window: next })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <HeadingWithTooltip
          title="How far in advance can students book?"
          tooltip={TOOLTIP_ADVANCE_BOOKING}
          variant={variant}
        />
        <AdvanceBookingSelector
          value={current.advance_booking_policy || EMPTY_FIELD}
          onChange={(next) => emit({ advance_booking_policy: next })}
          hideHeading
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <HeadingWithTooltip
          title="Break after a class"
          tooltip={TOOLTIP_BREAK}
          variant={variant}
        />
        <BreakTimeSelector
          value={current.break_after_class_hours || EMPTY_FIELD}
          onChange={(next) => emit({ break_after_class_hours: next })}
          hideHeading
          disabled={disabled}
        />
      </div>
    </div>
  );
}
