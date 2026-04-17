import React from 'react';
// This page will allow users to view tutor availability and book sessions.
// It will feature a main calendar component.
import Calendar from '../components/calendar/Calendar';

export default function BookingCalendar() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Book a Session</h1>
      <Calendar />
    </div>
  );
}