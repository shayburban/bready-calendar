import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DayScheduleRow from './DayScheduleRow';
import { useTeacher } from '@/components/teacher-registration/TeacherContext';

const TeacherSetCalendarAvailability = () => {
  const { availability, dispatchAvailability } = useTeacher();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      </CardContent>
    </Card>
  );
};

export default TeacherSetCalendarAvailability;