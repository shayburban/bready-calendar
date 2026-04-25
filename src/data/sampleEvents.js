// Single source of truth for teacher calendar mock events.
// Both the monthly and weekly views consume from here.
// Shape: { id, date (day-of-month), time ('HH:MM - HH:MM'), type, role,
//          color (Tailwind bg-*), description, student?, teacher?,
//          timeSlots?, count?, reschedule? }

export const sampleEvents = [
  { id: 1, date: 10, time: '11:00 - 14:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 5, description: 'Available for booking', timeSlots: ['11:00-12:00', '12:00-13:00', '13:00-14:00'] },
  { id: 2, date: 11, time: '11:00 - 14:00', type: 'booked', role: 'S', color: 'bg-orange-500', student: 'John D.', description: 'Mathematics tutoring session' },
  { id: 3, date: 12, time: '11:00 - 14:00', type: 'synced', color: 'bg-blue-500', description: 'Google Calendar event', timeSlots: ['15:00 - 16:00', '17:00 - 19:00'] },
  { id: 4, date: 15, time: '11:00 - 14:00', type: 'synced', color: 'bg-blue-500', description: 'Synced calendar event', timeSlots: ['15:00 - 16:00', '17:00 - 19:00', '17:00 - 19:00'] },
  { id: 5, date: 16, time: '11:00 - 14:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 5, description: 'Available slots', timeSlots: ['11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'] },
  { id: 6, date: 17, time: '11:00 - 14:00', type: 'not-reviewed', role: 'T', color: 'bg-red-500', student: 'Sarah M.', description: 'Pending review for Physics session' },
  { id: 7, date: 18, time: '11:00 - 14:00', type: 'cancelled', role: 'S', color: 'bg-gray-600', description: 'Session cancelled by student' },
  { id: 8, date: 25, time: '11:00 - 14:00', type: 'cancelled', role: 'T', color: 'bg-gray-600', description: 'Cancelled session by teacher' },
  { id: 9, date: 10, time: '15:00 - 16:00', type: 'availability', role: 'T', color: 'bg-green-500', description: 'Additional availability', timeSlots: ['15:00-16:00'] },
  { id: 10, date: 10, time: '16:00 - 17:00', type: 'availability', role: 'S', color: 'bg-green-500', description: 'My study slot', timeSlots: ['16:00-17:00'] },
  { id: 11, date: 16, time: '15:00 - 16:00', type: 'availability', role: 'T', color: 'bg-green-500', description: 'Afternoon slot', timeSlots: ['15:00-16:00'] },
  { id: 12, date: 19, time: '15:00 - 16:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student N.', description: 'Global Booking Test' },
  { id: 13, date: 24, time: '11:00 - 14:00', type: 'not-reviewed', role: 'S', color: 'bg-red-500', teacher: 'Teacher N.', description: 'Pending review as a student' },
  { id: 14, date: 22, time: '11:00 - 14:00', type: 'booked', role: 'S', reschedule: true, color: 'bg-orange-500', teacher: 'Teacher N.', description: 'Reschedule proposed by student' },
  { id: 15, date: 23, time: '11:00 - 14:00', type: 'booked', role: 'T', reschedule: true, color: 'bg-orange-500', student: 'Student N.', description: 'Reschedule proposed by teacher' },
  { id: 16, date: 26, time: '11:00 - 14:00', type: 'waiting', role: 'T', color: 'bg-pink-200', student: 'Student N.', description: 'Waiting For Confirmation - new booking' },
  { id: 17, date: 27, time: '11:00 - 14:00', type: 'waiting', role: 'T', reschedule: true, color: 'bg-pink-200', student: 'Student N.', description: 'Waiting For Confirmation - reschedule request' },
  { id: 18, date: 28, time: '11:00 - 14:00', type: 'waiting', role: 'S', color: 'bg-pink-200', teacher: 'Teacher N.', description: 'Waiting For Confirmation (S) - new booking' },
  { id: 19, date: 29, time: '11:00 - 14:00', type: 'waiting', role: 'S', reschedule: true, color: 'bg-pink-200', teacher: 'Teacher N.', description: 'Waiting For Confirmation (S) - reschedule request' },
  { id: 20, date: 30, time: '11:00 - 14:00', type: 'completed', role: 'T', color: 'bg-gray-800', student: 'Student N.', description: 'Completed (T)' },
  { id: 21, date: 20, time: '11:00 - 14:00', type: 'completed', role: 'S', color: 'bg-gray-800', teacher: 'Teacher N.', description: 'Completed (S)' },
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
