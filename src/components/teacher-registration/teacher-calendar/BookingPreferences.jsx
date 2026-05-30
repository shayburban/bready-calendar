import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityWindow from './AvailabilityWindow';
import AdvanceBooking from './AdvanceBooking';
import BreakTime from './BreakTime';

const BookingPreferences = () => {
  // Task 4 — `relative isolate` creates a fresh stacking context so
  // any invisible/transparent ancestor overlay (e.g. a transformed
  // parent, a fixed footer bounding box, or an opened-but-unclosed
  // sibling dropdown from TeacherSetCalendarAvailability above) can't
  // layer over the dropdowns or the Trash icon inside. Without this,
  // the Time Unit dropdown and the bin icon for Availability Window
  // could become unclickable when the user scrolled to the bottom of
  // Page 5c — guest-role flow hit this most often. `relative` keeps
  // legacy `top/left/z-index` heuristics intact for any child that
  // relies on the nearest positioned ancestor.
  return (
    <Card className="shadow-sm relative isolate">
      <CardContent className="pt-6 space-y-8">
        <AvailabilityWindow />
        <AdvanceBooking />
        <BreakTime />
      </CardContent>
    </Card>
  );
};

export default BookingPreferences;