import React, { useState } from 'react';
import NewBookingForm from './NewBookingForm';

// Calendar sidebar "New Booking" panel (monthly + weekly). Renders the SAME
// shared <NewBookingForm/> the "Add New Booking Or Availability" popup's
// "New Booking" tab uses, so both surfaces have identical logic — three modes
// (known student / new guest / book a teacher as a student), live search,
// future-only date + time pickers, Repeat, validation, and the real backend
// submit calls. The previous fully-mock panel (hardcoded 2021 data, dead
// buttons) has been retired.
//
// Cancel / Done remounts the form (resetKey bump) so it clears after a send.
export default function CalendarNewBookingPanel({ onBookingCreated }) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h4 className="text-lg font-bold text-gray-800">New Booking</h4>
      <NewBookingForm
        key={resetKey}
        onBookingCreated={onBookingCreated}
        onClose={() => setResetKey((k) => k + 1)}
      />
    </div>
  );
}
