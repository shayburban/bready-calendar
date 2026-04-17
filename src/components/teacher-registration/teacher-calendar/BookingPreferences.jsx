import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AvailabilityWindow from './AvailabilityWindow';
import AdvanceBooking from './AdvanceBooking';
import BreakTime from './BreakTime';

const BookingPreferences = () => {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 space-y-8">
        <AvailabilityWindow />
        <AdvanceBooking />
        <BreakTime />
      </CardContent>
    </Card>
  );
};

export default BookingPreferences;