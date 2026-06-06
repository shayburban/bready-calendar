// Global Start Date + End Date pair component.
//
// Parallels the role <TimeRangeFields/> plays for the Start/End Time
// pair: a thin, reusable wrapper around the canonical primitive (here
// DateRangePicker — the same Popover-based, custom-rendered calendar
// the sidebar's Set Availability tab uses) with the multi-row controls
// hidden by default so it works standalone.
//
// Used by:
//   • CalendarSidebar's date row map (indirectly — that surface still
//     mounts the multi-row DateRangePicker directly because it needs
//     the add/remove + primary-row management).
//   • CalendarNewBookingPanel — Start/End Date in BookingForm.
//   • Any future surface that needs a single Start Date + End Date
//     pair without the multi-row machinery.
//
// CUSTOMIZATION CONTRACT — IMPORTANT
//   Consumers customize FOR THEIR SURFACE via the props below.
//   They MUST NOT modify DateRangePicker or this wrapper to add
//   surface-specific behavior — that's what the prop pass-through
//   is for. The global primitive stays one source of truth; per-
//   surface look/feel rides through props (className, invalid markers,
//   noEndDate semantics) so a change in New Booking can never affect
//   the sidebar or the popup cards, and vice versa.

import React from 'react';
import DateRangePicker from './DateRangePicker';

export default function DateRangeFields({
  startDate,
  endDate,
  // ({ startDate, endDate }) => void — emits a full {start, end}
  // payload (either side may be null) so callers can drop straight
  // into a useState setter.
  onChange,
  // Per-field invalid markers — feed in from the surface's own
  // validation pipeline. The shared DateRangePicker primitive
  // already lights up the matching trigger with a red ring.
  startInvalid = false,
  endInvalid = false,
  // Pass-through. When true the End Date trigger renders ∞ (Inf.)
  // and stays disabled until the consumer toggles it back off.
  noEndDate = false,
  // Pass-through to the underlying primitive's root wrapper — used
  // for per-surface layout / spacing overrides without touching the
  // primitive.
  className = '',
}) {
  return (
    <DateRangePicker
      value={{ startDate, endDate }}
      onRangeChange={(rangeData) => {
        if (typeof onChange !== 'function') return;
        onChange({
          startDate: rangeData?.startDate ?? null,
          endDate: rangeData?.endDate ?? null,
        });
      }}
      // The Set Availability tab uses these controls (the +/X add-
      // and-remove-row affordances). For the standalone Start + End
      // pair use case we hide them. The underlying primitive still
      // renders the two date triggers + the calendar popover.
      showControls={false}
      hideRemove
      noEndDate={noEndDate}
      startInvalid={startInvalid}
      endInvalid={endInvalid}
      className={className}
    />
  );
}
