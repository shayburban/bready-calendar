import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DayScheduleRow from './DayScheduleRow';
import { useTeacher } from '@/components/teacher-registration/TeacherContext';

// Mirrors DayScheduleRow's validity check: a slot only counts once both ends
// are set and end is strictly after start (times are 24h "HH:MM").
const timeToMinutes = (t) => {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const TeacherSetCalendarAvailability = () => {
  const { availability, dispatchAvailability } = useTeacher();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // The same slot data the rows above use, distilled to the days/time-blocks
  // the teacher actually selected. Drives the summary box below (the weekly
  // equivalent of the "Set Availability (T)" tab's dates & hours review).
  const selectedDays = daysOfWeek
    .map((day) => ({
      day,
      ranges: (availability.slots[day] || []).filter(
        (s) => s.start && s.end && timeToMinutes(s.end) > timeToMinutes(s.start)
      ),
    }))
    .filter((d) => d.ranges.length > 0);

  const handleSlotChange = (day, slotId, updatedSlot) => {
    dispatchAvailability({
      type: 'UPDATE_SLOT',
      payload: { day, index: slotId, update: updatedSlot }
    });
  };

  const handleAddSlot = (day) => {
    dispatchAvailability({
      type: 'ADD_SLOT',
      payload: { day }
    });
  };

  const handleRemoveSlot = (day, slotId) => {
    dispatchAvailability({
      type: 'REMOVE_SLOT',
      payload: { day, index: slotId }
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">Set Your Availability</CardTitle>
        <CardDescription>
          Define your weekly teaching hours. You can add multiple time slots for each day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {daysOfWeek.map(day => (
          <DayScheduleRow
            key={day}
            day={day}
            dayLabel={day}
            slots={availability.slots[day] || []}
            onSlotChange={(slotId, updatedSlot) => handleSlotChange(day, slotId, updatedSlot)}
            onAddSlot={() => handleAddSlot(day)}
            onRemoveSlot={(slotId) => handleRemoveSlot(day, slotId)}
            allSlotsForValidation={availability.slots[day] || []}
            isToggled={availability.slots[day] && availability.slots[day].length > 0}
          />
        ))}

        {/* Availability summary + warning — sits at the very end of the
            hours/days selection, mirroring the "Set Availability (T)" tab's
            review box and Step 5b's yellow alert styling. */}
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
            <h5 className="font-bold text-gray-800">Changes will be made to the following dates & hours:</h5>
            <div>
              <h6 className="font-semibold">Days & Timings:</h6>
              {selectedDays.length === 0 ? (
                <p className="text-gray-400 italic">No availability selected yet</p>
              ) : (
                selectedDays.map(({ day, ranges }) => (
                  <p key={day}>
                    <span className="text-gray-800 font-medium">{day}:</span>{' '}
                    {ranges.map((r) => `${r.start} – ${r.end}`).join(', ')}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-yellow-800 font-bold">Setting Your Availability as a teacher (T)</p>
              <ul className="list-disc list-inside space-y-2 text-yellow-800 font-medium">
                <li>The times you select here become your live Teacher Availability, allowing students to instantly book lessons.</li>
                <li>You can edit these hours anytime in your Teacher Calendar.</li>
              </ul>
              <p className="text-yellow-800 font-medium">Removing a time slot immediately stops new bookings for that time.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherSetCalendarAvailability;