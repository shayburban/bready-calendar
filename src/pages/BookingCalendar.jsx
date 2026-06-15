import React from 'react';
// This page lets users view tutor availability and book sessions. With
// INSTANT_BOOKING on it renders the live slot picker; otherwise the legacy
// placeholder, so flags-off is byte-identical to today (Constraint 3).
import Calendar from '../components/calendar/Calendar';
import InstantBookingView from '@/components/scheduling/InstantBookingView';
import { instantBookingEnabled } from '@/lib/scheduling/flags';

export default function BookingCalendar() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Book a Session</h1>
      {instantBookingEnabled() ? <InstantBookingView /> : <Calendar />}
    </div>
  );
}