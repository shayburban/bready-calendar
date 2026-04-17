import React from 'react';
import TeacherCalendarMain from './teacher-calendar/TeacherCalendarMain';

export default function Step5cAvailability({ currentSubStep, setCurrentSubStep }) {
  return (
    <div className="max-w-4xl mx-auto">
      <TeacherCalendarMain setCurrentSubStep={setCurrentSubStep} />
    </div>
  );
}