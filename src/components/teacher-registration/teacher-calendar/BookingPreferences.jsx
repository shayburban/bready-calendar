import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityWindow from './AvailabilityWindow';
import AdvanceBooking from './AdvanceBooking';
import BreakTime from './BreakTime';
import { useTeacher } from '@/components/teacher-registration/TeacherContext';

// Normalise to the wrapper's expected {preference, preferenceType}
// shape so a legacy reducer value (the old `breakAfterClassInHours: 0`,
// for example) can't surprise the wrapper. Anything non-object becomes
// the pristine empty pair.
const EMPTY_PAIR = { preference: null, preferenceType: null };
const toPair = (v) =>
  v && typeof v === 'object' && 'preference' in v && 'preferenceType' in v
    ? v
    : EMPTY_PAIR;

// `showErrors` is threaded from TeacherForm via Step5cAvailability →
// TeacherCalendarMain → here. It cascades into each paired-dropdown
// wrapper so the red Alert + red field-border ring surface only after
// the user attempts to advance the form (Rule 2 — submit-triggered
// error UI). Same source-of-truth `common/AvailabilityWindow.jsx`,
// `AdvanceBookingSelector.jsx`, `BreakTimeSelector.jsx` are used by
// the Calendar Sidebar too, so the validation behaviour is identical
// across both surfaces (Rule 4 — cross-component sync).
//
// Data flow wiring (new):
//   user picks value in the wrapper
//   → wrapper local state updates
//   → wrapper `onDataChange(v)` fires
//   → BookingPreferences dispatches SET_WINDOW / SET_ADVANCE_BOOKING /
//     SET_BREAK_TIME to TeacherContext
//   → `availability.*` in the reducer now reflects the user's choice
//   → TeacherForm.validateStep's partial-pair gate (5c) reads the
//     reducer state and refuses to advance on invalid input
//   → TeacherForm.handleSubmit's TeacherProfile.create payload reads
//     the SAME reducer state and persists the user's actual choices
const BookingPreferences = ({ showErrors = false }) => {
  const { availability, dispatchAvailability } = useTeacher();
  // Task 2 (current batch) — Page-5c pointer-events fix.
  //
  // `relative isolate` already creates an isolated stacking context
  // for the card. We now ALSO add:
  //
  //   • z-10                — lifts the card above any sibling
  //                            section in TeacherCalendarMain whose
  //                            absolutely-positioned children might
  //                            otherwise escape their intended ancestor
  //                            and overlay the Availability Window
  //                            row at the bottom of the page
  //                            (CustomTimeInput inside
  //                            TeacherSetCalendarAvailability uses
  //                            `absolute z-50 top-full` — without an
  //                            explicit lift here the dropdown layer
  //                            from that earlier section could mask
  //                            the trash button + Time Unit dropdown
  //                            in this card once the user scrolled
  //                            past it).
  //   • pointer-events-auto — breaks any cascading
  //                            pointer-events: none from a higher
  //                            ancestor at this section boundary, so
  //                            the inputs inside this card always
  //                            receive clicks regardless of what's
  //                            happening above them.
  return (
    <Card className="shadow-sm relative isolate z-10 pointer-events-auto">
      <CardContent className="pt-6 space-y-8">
        <AvailabilityWindow
          showErrors={showErrors}
          initialData={toPair(availability.availabilityWindow)}
          onDataChange={(v) => dispatchAvailability({ type: 'SET_WINDOW', payload: v })}
        />
        <AdvanceBooking
          showErrors={showErrors}
          initialData={toPair(availability.farAdvanceBookingFromStudent)}
          onDataChange={(v) => dispatchAvailability({ type: 'SET_ADVANCE_BOOKING', payload: v })}
        />
        <BreakTime
          showErrors={showErrors}
          initialData={toPair(availability.breakAfterClassInHours)}
          onDataChange={(v) => dispatchAvailability({ type: 'SET_BREAK_TIME', payload: v })}
        />
      </CardContent>
    </Card>
  );
};

export default BookingPreferences;