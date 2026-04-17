import React from 'react';
import TimezoneSelector from './TimezoneSelector';
import TeacherSetCalendarAvailability from '@/components/common/teacher-set-calendar-availability/TeacherSetCalendarAvailability';
import BookingPreferences from './BookingPreferences';

const TeacherCalendarMain = ({ setCurrentSubStep }) => {
  return (
    <div className="space-y-8">
      {/* Timezone Section */}
      <TimezoneSelector />
      
      {/* Availability Scheduler */}
      <TeacherSetCalendarAvailability />
      
      {/* Booking Preferences */}
      <BookingPreferences />
    </div>
  );
};

export default TeacherCalendarMain;