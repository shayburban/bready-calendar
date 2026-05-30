import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityWindow from './AvailabilityWindow';
import AdvanceBooking from './AdvanceBooking';
import BreakTime from './BreakTime';

// `showErrors` is threaded from TeacherForm via Step5cAvailability →
// TeacherCalendarMain → here. It cascades into each paired-dropdown
// wrapper so the red Alert + red field-border ring surface only after
// the user attempts to advance the form (Rule 2 — submit-triggered
// error UI). Same source-of-truth `common/AvailabilityWindow.jsx`,
// `AdvanceBookingSelector.jsx`, `BreakTimeSelector.jsx` are used by
// the Calendar Sidebar too, so the validation behavior is identical
// across both surfaces (Rule 4 — cross-component sync).
const BookingPreferences = ({ showErrors = false }) => {
  // `relative isolate` retained as a no-op safety net: it creates an
  // isolated stacking context for the card so any future absolutely
  // positioned overlay above cannot intercept these fields. Doesn't
  // affect layout.
  return (
    <Card className="shadow-sm relative isolate">
      <CardContent className="pt-6 space-y-8">
        <AvailabilityWindow showErrors={showErrors} />
        <AdvanceBooking showErrors={showErrors} />
        <BreakTime showErrors={showErrors} />
      </CardContent>
    </Card>
  );
};

export default BookingPreferences;