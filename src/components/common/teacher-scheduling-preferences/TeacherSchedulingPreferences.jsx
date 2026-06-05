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

import React, { useRef, useEffect, useCallback } from 'react';
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
  // Task 3 — submit-triggered validation. Sidebar / Page 5c flip this
  // to true only after Save is clicked. Cascades to each selector so
  // their error UI also gates on it.
  showErrors = false,
  // Task 3 — aggregate validity callback. Each child selector reports
  // its own validity; we OR them into a single boolean and surface it.
  // The host (sidebar) uses this to decide whether Save should actually
  // persist or just show errors.
  onValidityChange,
  // Rule 1 (sidebar) — host passes true when ANY row has saved DB
  // data; cascades to every child so all three trash icons hide. Page
  // 5c never sets this so its behaviour is unchanged.
  hideTrash = false,
}) {
  const current = value || {};

  // Bug-fix — Keep latest onChange / value / onValidityChange in refs
  // so the per-field callbacks below stay STABLE (no fresh inline-arrow
  // identity each render) AND so the merge ALWAYS reads the freshest
  // value, not a closure snapshot. Together those two properties are
  // what stop sibling pristine rows from clobbering the row the user
  // just edited — the root cause of the "Save stays grey with one or
  // more completed rows" bug, and a contributor to the Cancel flicker /
  // lingering-trash bugs.
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { valueRef.current = value; });

  const emitField = useCallback((field, next) => {
    const fn = onChangeRef.current;
    if (typeof fn !== 'function') return;
    // Merge against the freshest value, NOT a render-time snapshot,
    // so concurrent emits in the same commit can never overwrite
    // each other.
    fn({ ...(valueRef.current || {}), [field]: next });
  }, []);

  const handleWindow = useCallback((n) => emitField('availability_window', n), [emitField]);
  const handleAdvance = useCallback((n) => emitField('advance_booking_policy', n), [emitField]);
  const handleBreak = useCallback((n) => emitField('break_after_class_hours', n), [emitField]);

  // Track per-field validity in refs (no re-render on update) and emit
  // an aggregate via onValidityChange. The selectors emit
  // `onValidationChange(true)` whenever their state is pristine OR
  // fully-valid; `false` when partially filled / over limit.
  const validityRef = useRef({
    availability_window: true,
    advance_booking_policy: true,
    break_after_class_hours: true,
  });
  const lastEmittedRef = useRef(true);
  const onValidityChangeRef = useRef(onValidityChange);
  useEffect(() => { onValidityChangeRef.current = onValidityChange; });

  const updateValidity = useCallback((field, isValid) => {
    if (validityRef.current[field] === isValid) return;
    validityRef.current[field] = isValid;
    const aggregate = Object.values(validityRef.current).every(Boolean);
    if (aggregate !== lastEmittedRef.current) {
      lastEmittedRef.current = aggregate;
      const fn = onValidityChangeRef.current;
      if (typeof fn === 'function') fn(aggregate);
    }
  }, []);

  // Stable per-field validity handlers so each child's validation
  // effect (whose deps are now `[duration, timeUnit]`) sees a steady
  // onValidationChange identity — required for A2 in the selectors
  // to work correctly.
  const handleValidityWindow = useCallback((v) => updateValidity('availability_window', v), [updateValidity]);
  const handleValidityAdvance = useCallback((v) => updateValidity('advance_booking_policy', v), [updateValidity]);
  const handleValidityBreak = useCallback((v) => updateValidity('break_after_class_hours', v), [updateValidity]);

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
          onChange={handleWindow}
          disabled={disabled}
          showErrors={showErrors}
          hideTrash={hideTrash}
          onValidationChange={handleValidityWindow}
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
          onChange={handleAdvance}
          hideHeading
          disabled={disabled}
          showErrors={showErrors}
          hideTrash={hideTrash}
          onValidationChange={handleValidityAdvance}
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
          onChange={handleBreak}
          hideHeading
          disabled={disabled}
          showErrors={showErrors}
          hideTrash={hideTrash}
          onValidationChange={handleValidityBreak}
        />
      </div>
    </div>
  );
}
