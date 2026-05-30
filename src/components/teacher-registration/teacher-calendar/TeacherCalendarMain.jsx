import React from 'react';
import TimezoneSelector from './TimezoneSelector';
import TeacherSetCalendarAvailability from '@/components/common/teacher-set-calendar-availability/TeacherSetCalendarAvailability';
import BookingPreferences from './BookingPreferences';

const TeacherCalendarMain = ({ setCurrentSubStep, showValidationErrors = false }) => {
  return (
    <div className="space-y-8">
      {/* Timezone Section */}
      <TimezoneSelector />

      {/* Availability Scheduler */}
      <TeacherSetCalendarAvailability />

      {/* Booking Preferences — receives showValidationErrors so the
          three paired-dropdown fields surface red borders/messages only
          after the user clicks Next on this sub-step (Rule 2). */}
      <BookingPreferences showErrors={showValidationErrors} />
    </div>
  );
};

export default TeacherCalendarMain;