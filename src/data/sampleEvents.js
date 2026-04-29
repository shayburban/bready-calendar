// Single source of truth for teacher calendar mock events.
// Both the monthly and weekly views consume from here.
//
// All mock events live within ONE calendar week (April 19-25, 2026,
// Sun-Sat) so the weekly view can showcase every type+role combo at once.
// The monthly view also reads from this list, so the same events appear in
// both places.
//
// Shape: { id, date (day-of-month), time ('HH:MM - HH:MM'), type, role,
//          color (Tailwind bg-*), description, student?, teacher?,
//          timeSlots?, count?, reschedule? }

export const sampleEvents = [
  // --- Sun, April 19 ---
  { id: 1, date: 19, time: '08:00 - 09:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 5, description: 'Available for booking', timeSlots: ['08:00-09:00', '11:00-12:00', '13:00-14:00'] },
  { id: 2, date: 19, time: '09:00 - 10:00', type: 'availability', role: 'S', color: 'bg-green-500', description: 'My study slot as a student', timeSlots: ['09:00-10:00'] },
  { id: 3, date: 19, time: '13:00 - 14:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student N.', description: 'Confirmed lesson as teacher' },

  // --- Mon, April 20 ---
  { id: 4, date: 20, time: '10:00 - 11:00', type: 'booked', role: 'S', color: 'bg-orange-500', teacher: 'Teacher N.', description: 'Confirmed lesson as student' },
  { id: 5, date: 20, time: '14:00 - 15:00', type: 'booked', role: 'S', reschedule: true, color: 'bg-orange-500', teacher: 'Teacher N.', description: 'Reschedule proposed by student' },
  { id: 6, date: 20, time: '16:00 - 17:00', type: 'booked', role: 'T', reschedule: true, color: 'bg-orange-500', student: 'Student N.', description: 'Reschedule proposed by teacher' },

  // --- Tue, April 21 ---
  { id: 7, date: 21, time: '10:00 - 11:00', type: 'not-reviewed', role: 'T', color: 'bg-red-500', student: 'Sarah M.', description: 'Pending review for Physics session' },
  { id: 8, date: 21, time: '14:00 - 15:00', type: 'not-reviewed', role: 'S', color: 'bg-red-500', teacher: 'Teacher N.', description: 'Pending review as a student' },
  { id: 9, date: 21, time: '16:00 - 17:00', type: 'synced', color: 'bg-blue-500', description: 'Google Calendar event', timeSlots: ['15:00 - 16:00', '17:00 - 19:00'] },

  // --- Wed, April 22 ---
  { id: 10, date: 22, time: '10:00 - 11:00', type: 'completed', role: 'T', color: 'bg-gray-800', student: 'Student N.', description: 'Completed (T)' },
  { id: 11, date: 22, time: '14:00 - 15:00', type: 'completed', role: 'S', color: 'bg-gray-800', teacher: 'Teacher N.', description: 'Completed (S)' },

  // --- Thu, April 23 ---
  { id: 12, date: 23, time: '10:00 - 11:00', type: 'cancelled', role: 'T', color: 'bg-gray-600', description: 'Cancelled session by teacher' },
  { id: 13, date: 23, time: '14:00 - 15:00', type: 'cancelled', role: 'S', color: 'bg-gray-600', description: 'Session cancelled by student' },

  // --- Fri, April 24 ---
  { id: 14, date: 24, time: '10:00 - 11:00', type: 'waiting', role: 'T', color: 'bg-pink-200', student: 'Student N.', description: 'Waiting For Confirmation - new booking' },
  { id: 15, date: 24, time: '14:00 - 15:00', type: 'waiting', role: 'S', color: 'bg-pink-200', teacher: 'Teacher N.', description: 'Waiting For Confirmation - new booking (S)' },

  // --- Sat, April 25 ---
  { id: 16, date: 25, time: '10:00 - 11:00', type: 'waiting', role: 'T', reschedule: true, color: 'bg-pink-200', student: 'Student N.', description: 'Waiting For Confirmation - reschedule (T)' },
  { id: 17, date: 25, time: '14:00 - 15:00', type: 'waiting', role: 'S', reschedule: true, color: 'bg-pink-200', teacher: 'Teacher N.', description: 'Waiting For Confirmation - reschedule (S)' },
  { id: 18, date: 25, time: '17:00 - 18:00', type: 'synced', color: 'bg-blue-500', description: 'Synced calendar event', timeSlots: ['15:00 - 16:00', '17:00 - 19:00', '17:00 - 19:00'] },

  // --- Sun, April 12 (4 Waiting events, mixed S/T — single-category overflow) ---
  { id: 33, date: 12, time: '09:00 - 10:00', type: 'waiting', role: 'T', color: 'bg-pink-200', student: 'Student A.', description: 'Waiting For Confirmation (T) #1' },
  { id: 34, date: 12, time: '11:00 - 12:00', type: 'waiting', role: 'S', color: 'bg-pink-200', teacher: 'Teacher B.', description: 'Waiting For Confirmation (S) #1' },
  { id: 35, date: 12, time: '14:00 - 15:00', type: 'waiting', role: 'T', color: 'bg-pink-200', student: 'Student C.', description: 'Waiting For Confirmation (T) #2' },
  { id: 36, date: 12, time: '17:00 - 18:00', type: 'waiting', role: 'S', color: 'bg-pink-200', teacher: 'Teacher D.', description: 'Waiting For Confirmation (S) #2' },

  // --- Tue, April 14 (4 Booked events, mixed S/T — single-category overflow) ---
  { id: 37, date: 14, time: '08:00 - 09:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student E.', description: 'Confirmed lesson (T) #1' },
  { id: 38, date: 14, time: '10:00 - 11:00', type: 'booked', role: 'S', color: 'bg-orange-500', teacher: 'Teacher F.', description: 'Confirmed lesson (S) #1' },
  { id: 39, date: 14, time: '13:00 - 14:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student G.', description: 'Confirmed lesson (T) #2' },
  { id: 40, date: 14, time: '16:00 - 17:00', type: 'booked', role: 'S', color: 'bg-orange-500', teacher: 'Teacher H.', description: 'Confirmed lesson (S) #2' },

  // --- Mon, April 27 (mixed FUTURE: Booked + Waiting + Availability + Synced) ---
  { id: 19, date: 27, time: '08:00 - 09:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 2, description: 'Available for booking (T)' },
  { id: 20, date: 27, time: '09:00 - 10:00', type: 'availability', role: 'S', color: 'bg-green-500', description: 'Other availability (S)' },
  { id: 21, date: 27, time: '10:00 - 11:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student N.', description: 'Confirmed lesson (T)' },
  { id: 22, date: 27, time: '12:00 - 13:00', type: 'booked', role: 'S', color: 'bg-orange-500', teacher: 'Teacher N.', description: 'Confirmed lesson (S)' },
  { id: 23, date: 27, time: '14:00 - 15:00', type: 'waiting', role: 'T', color: 'bg-pink-200', student: 'Student N.', description: 'Waiting For Confirmation (T)' },
  { id: 24, date: 27, time: '16:00 - 17:00', type: 'waiting', role: 'S', color: 'bg-pink-200', teacher: 'Teacher N.', description: 'Waiting For Confirmation (S)' },
  { id: 25, date: 27, time: '18:00 - 19:00', type: 'synced', color: 'bg-blue-500', description: 'Synced calendar event' },

  // --- Wed, April 8 (mixed PAST: Completed + Cancellation Fees + Not Reviewed + Synced) ---
  { id: 26, date: 8, time: '09:00 - 10:00', type: 'completed', role: 'T', color: 'bg-gray-800', student: 'Student N.', description: 'Completed (T)' },
  { id: 27, date: 8, time: '10:00 - 11:00', type: 'completed', role: 'S', color: 'bg-gray-800', teacher: 'Teacher N.', description: 'Completed (S)' },
  { id: 28, date: 8, time: '12:00 - 13:00', type: 'cancelled', role: 'T', color: 'bg-gray-600', description: 'Cancellation Fees (T)' },
  { id: 29, date: 8, time: '13:00 - 14:00', type: 'cancelled', role: 'S', color: 'bg-gray-600', description: 'Cancellation Fees (S)' },
  { id: 30, date: 8, time: '15:00 - 16:00', type: 'not-reviewed', role: 'T', color: 'bg-red-500', student: 'Student N.', description: 'Not Reviewed (T)' },
  { id: 31, date: 8, time: '16:00 - 17:00', type: 'not-reviewed', role: 'S', color: 'bg-red-500', teacher: 'Teacher N.', description: 'Not Reviewed (S)' },
  { id: 32, date: 8, time: '18:00 - 19:00', type: 'synced', color: 'bg-blue-500', description: 'Synced calendar event' },
];

// Maps the monthly solid bg-* color to the weekly's left-border + tinted bg style.
export const weeklyColorMap = {
  'bg-green-500': 'border-l-4 border-green-500 bg-green-50',
  'bg-orange-500': 'border-l-4 border-orange-500 bg-orange-50',
  'bg-red-500': 'border-l-4 border-red-500 bg-red-50',
  'bg-blue-500': 'border-l-4 border-blue-500 bg-blue-50',
  'bg-gray-600': 'border-l-4 border-gray-600 bg-gray-50',
  'bg-gray-800': 'border-l-4 border-gray-700 bg-gray-100',
  'bg-pink-200': 'border-l-4 border-pink-500 bg-pink-50',
};

export const weeklyTitleMap = {
  availability: 'Availability',
  booked: 'Booked Session',
  'not-reviewed': 'Not Reviewed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  waiting: 'Waiting For Confirmation',
  synced: 'Synced Event',
};

// Parse 'HH:MM - HH:MM' into numeric { startHour, endHour } (fractional for minutes).
export function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return { startHour: 0, endHour: 1 };
  const [start, end] = timeStr.split(' - ');
  const toFloat = (s) => {
    const [h, m] = s.split(':').map((v) => parseInt(v, 10));
    return (h || 0) + (m || 0) / 60;
  };
  return { startHour: toFloat(start), endHour: toFloat(end) };
}
