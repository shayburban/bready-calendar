// Shared mapper: a get_my_bookings row -> the calendar's event shape, in the
// viewer's local zone. Used by BOTH the monthly (TeacherCalendar) and weekly
// (TeacherCalendarWeekly) views so they render live bookings identically.
//
// Only the three rendered states are mapped: a `requested` row becomes the pink
// "Waiting For Confirmation" chip the teacher confirms/declines; `confirmed` ->
// booked; `completed` -> completed. `declined`/`pending` are not shown on the
// grid. The extra {year, month} let the grids place real events on their EXACT
// month/day (the legacy day-of-month-only key repeated on every month).

const STATUS_TO_TYPE = { requested: 'waiting', confirmed: 'booked', completed: 'completed' };
const TYPE_TO_COLOR = { waiting: 'bg-pink-200', booked: 'bg-orange-500', completed: 'bg-gray-800' };
const pad2 = (n) => String(n).padStart(2, '0');

export function mapBookingToEvent(b) {
  const type = STATUS_TO_TYPE[b.status];
  if (!type) return null;
  const start = new Date(b.start_time);
  const end = new Date(b.end_time);
  if (isNaN(start) || isNaN(end)) return null;
  const role = b.viewer_role === 'teacher' ? 'T' : 'S';
  return {
    id: b.id,
    bookingId: b.id,
    date: start.getDate(),
    year: start.getFullYear(),
    month: start.getMonth(),
    time: `${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    type,
    role,
    status: b.status,
    color: TYPE_TO_COLOR[type] || 'bg-gray-500',
    student: role === 'T' ? (b.student_name || 'Student') : undefined,
    teacher: role === 'S' ? (b.tutor_name || 'Teacher') : undefined,
    student_name: b.student_name,
    tutor_name: b.tutor_name,
    subject: b.subject,
    amount: b.amount,
    duration_hours: b.duration_hours,
    hourly_rate: b.hourly_rate,
    start_time: b.start_time,
    end_time: b.end_time,
    description: type === 'waiting'
      ? 'Out-of-availability request awaiting your confirmation'
      : undefined,
  };
}
