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
  // `relative isolate` retained as a no-op safety net: it creates an
  // isolated stacking context for the card so any future absolutely
  // positioned overlay above cannot intercept these fields. Doesn't
  // affect layout.
  return (
    <Card className="shadow-sm relative isolate">
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