// Reusable Start Time / End Time field pair.
//
// Mounted by:
//   • CalendarSidebar's TimeAvailabilityRow (Set Availability tab)
//   • CalendarNewBookingPanel's BookingForm (Time Of Booking row)
//
// Both surfaces get the SAME dropdown styling, SAME chronological
// filtering, SAME auto-focus-next on Start commit, and the SAME
// per-field invalid markers — satisfying the "reuse the exact same
// component" requirement.
//
// Bidirectional filtering (Task 2):
//   • If Start is set, End's options are filtered to `> Start`
//     (existing forward direction — `minTime={startTime}`).
//   • If End is set, Start's options are filtered to `< End`
//     (new reverse direction — `maxTime={endTime}`). The user can
//     now pick End first and then narrow Start to valid options.
//
// Auto-focus-next:
//   • Picking BOTH hour and minute on Start fires `onValueCommit`, which opens
//     the End picker via `endTimeRef.current?.openAndFocus()` — UNLESS `manualEnd`
//     is set (Set Availability rows), where the End Time is fully manual: no
//     auto-fill and no auto-open; the user opens the End picker themselves.
//
// Forward-direction Start → End clear:
//   • If the user re-picks a Start that is >= the existing End,
//     End is cleared (preserves the legacy behavior that already
//     lived inside TimeAvailabilityRow).

import React, { useRef } from 'react';
import TimeSelect from './TimeSelect';

export default function TimeRangeFields({
  startTime,
  endTime,
  // ({ startTime, endTime }) => void — emits a full {start, end}
  // payload so callers can merge with the rest of a row in one go.
  onChange,
  startInvalid = false,
  endInvalid = false,
  // When true (Set Availability rows), the End Time is FULLY MANUAL: selecting a
  // Start never auto-fills End and never auto-opens the End picker — the user must
  // open the End picker and choose hour + minute themselves. When false (e.g. the
  // New Booking panel) the legacy auto-focus-next still opens the End picker.
  manualEnd = false,
  // Passed through to BOTH TimeSelect triggers. Used by popup cards
  // to blend the input bg with the surrounding card (Task 1 visual
  // override — e.g. `bg-transparent` so it doesn't show the sidebar's
  // contrasting `bg-gray-50` over a white modal). Tailwind-merge
  // resolves conflicting bg/border/etc. utilities in favor of the
  // override.
  triggerClassName,
  // Per-field placeholder text. Defaults to TimeSelect's own default
  // ('HH:MM') to preserve the sidebar's existing copy. Popup cards
  // override to 'Select time' (Task 1 spec).
  placeholder,
  // Optional lower bound ('HH:MM') applied as a floor to BOTH pickers — used by
  // the future-only popup cards: when the selected date is TODAY they pass the
  // current time so only later quarter-hours can be picked. Undefined/'' = no
  // floor (default, unchanged behavior). Combines with the existing Start↔End
  // interplay (End's floor is the later of Start and this minTime).
  minTime,
}) {
  const endTimeRef = useRef(null);
  const floor = minTime || '';
  // End must be after Start AND at/after the floor → use the later of the two.
  const endFloor = (() => {
    if (startTime && floor) return startTime > floor ? startTime : floor;
    return startTime || floor || undefined;
  })();

  return (
    <>
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-gray-700">Start Time</label>
        <TimeSelect
          value={startTime}
          // Future-only floor (today → current time) applied to Start.
          minTime={floor || undefined}
          // Reverse filter — when an End is already set, only show Start options
          // strictly before it. End stays empty while Start is picked (no
          // auto-fill), so this never restricts the Start minute grid.
          maxTime={endTime || undefined}
          onChange={(newStart) => {
            // Clear an End the new Start would invalidate; otherwise keep it.
            // End is NEVER derived from Start here (no auto-fill).
            if (endTime && newStart >= endTime) {
              onChange({ startTime: newStart, endTime: '' });
            } else {
              onChange({ startTime: newStart, endTime });
            }
          }}
          onValueCommit={() => {
            // Start fully chosen (hour + minute). Auto-advance to the End picker
            // (auto-focus-next) EXCEPT in manualEnd mode (Set Availability rows),
            // where the End Time stays empty + fully manual until the user opens
            // it and picks hour + minute themselves.
            if (!manualEnd) {
              endTimeRef.current?.openAndFocus();
            }
          }}
          invalid={startInvalid}
          triggerClassName={triggerClassName}
          {...(placeholder !== undefined ? { placeholder } : {})}
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-gray-700">End Time</label>
        <TimeSelect
          ref={endTimeRef}
          value={endTime}
          // Forward filter — only show options strictly greater than the chosen
          // Start AND at/after the future-only floor (the later of the two).
          minTime={endFloor}
          onChange={(newEnd) => onChange({ startTime, endTime: newEnd })}
          invalid={endInvalid}
          triggerClassName={triggerClassName}
          {...(placeholder !== undefined ? { placeholder } : {})}
        />
      </div>
    </>
  );
}
