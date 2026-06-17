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
//   • Picking BOTH hour and minute on Start fires
//     `onValueCommit` which calls `endTimeRef.current?.openAndFocus()`
//     to immediately open the End picker.
//
// Forward-direction Start → End clear:
//   • If the user re-picks a Start that is >= the existing End,
//     End is cleared (preserves the legacy behavior that already
//     lived inside TimeAvailabilityRow).

import React, { useRef } from 'react';
import TimeSelect from './TimeSelect';

// Next 15-minute grid time strictly after `start` ('HH:MM'), or '' when start is
// at/after the last grid slot (23:45). Used to default End to a valid FUTURE time
// the instant Start is picked (autoFillEnd) so End can never sit before Start.
const GRID_STEP_MIN = 15;
const defaultEndFor = (start) => {
  if (typeof start !== 'string') return '';
  const [h, m] = start.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const next = h * 60 + m + GRID_STEP_MIN;
  if (next > 23 * 60 + 45) return '';
  return `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`;
};

export default function TimeRangeFields({
  startTime,
  endTime,
  // ({ startTime, endTime }) => void — emits a full {start, end}
  // payload so callers can merge with the rest of a row in one go.
  onChange,
  startInvalid = false,
  endInvalid = false,
  // Phase 4.1 — when true, picking Start auto-fills End with the next valid
  // 15-min slot whenever End is empty or would land at/before Start (used by the
  // Set Availability rows). When false, the legacy "clear End" behavior is kept.
  autoFillEnd = false,
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
}) {
  const endTimeRef = useRef(null);

  return (
    <>
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-gray-700">Start Time</label>
        <TimeSelect
          value={startTime}
          // Reverse filter (pick End first, then narrow Start). DISABLED in
          // autoFill mode: there End is DERIVED from Start on completion, so
          // constraining Start by a freshly-derived End would (wrongly) collapse
          // the Start MINUTE options to :00 (Bug 1.1). Non-autoFill keeps it.
          maxTime={autoFillEnd ? undefined : (endTime || undefined)}
          onChange={(newStart) => {
            // Only clear an End the new Start would invalidate; never DERIVE End
            // here. In autoFill mode the +15 default is applied on COMPLETION
            // (onValueCommit) — applying it on the HOUR pick pinned End early and
            // restricted the Start minute grid.
            if (endTime && newStart >= endTime) {
              onChange({ startTime: newStart, endTime: '' });
            } else {
              onChange({ startTime: newStart, endTime });
            }
          }}
          onValueCommit={(committedStart) => {
            // Start fully chosen (hour + minute). autoFill: default End to Start +
            // 15 min WHEN End is empty or now invalid (so a deliberately-set longer
            // End survives a Start re-edit), then auto-open the End picker. End is
            // therefore always present and strictly after Start (Bug 1.2 / 1.3).
            if (autoFillEnd && (!endTime || committedStart >= endTime)) {
              onChange({ startTime: committedStart, endTime: defaultEndFor(committedStart) });
            }
            endTimeRef.current?.openAndFocus();
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
          // Forward filter — only show options strictly greater than
          // the chosen Start. Identical to the legacy behavior.
          minTime={startTime || undefined}
          onChange={(newEnd) => onChange({ startTime, endTime: newEnd })}
          invalid={endInvalid}
          triggerClassName={triggerClassName}
          {...(placeholder !== undefined ? { placeholder } : {})}
        />
      </div>
    </>
  );
}
