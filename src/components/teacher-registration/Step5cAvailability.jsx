import React from 'react';
import TeacherCalendarMain from './teacher-calendar/TeacherCalendarMain';

// `showValidationErrors` is threaded down from TeacherForm — when the
// teacher clicks Next on this sub-step with one of the paired dropdown
// fields half-filled, this flips to true and the red Alert + red field
// borders in the scheduling-preference selectors surface. See Rule 2.
export default function Step5cAvailability({
  currentSubStep,
  setCurrentSubStep,
  showValidationErrors = false,
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <TeacherCalendarMain
        setCurrentSubStep={setCurrentSubStep}
        showValidationErrors={showValidationErrors}
      />
    </div>
  );
}