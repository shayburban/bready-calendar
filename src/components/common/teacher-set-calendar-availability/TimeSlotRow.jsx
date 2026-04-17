import React from 'react';
import { X, Plus } from 'lucide-react';
import CustomTimeInput from './CustomTimeInput';
import { generateTimeOptions } from './time-options';

const TimeSlotRow = ({
  day,
  slot,
  onSlotChange,
  onRemoveSlot,
  onAddSlot,
  allSlotsForValidation
}) => {
  const handleTimeChange = (field, value) => {
    onSlotChange(slot.id, { ...slot, [field]: value });
  };

  const isIncomplete = (slot.start && !slot.end) || (!slot.start && slot.end);

  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-full">
        <CustomTimeInput
          placeholder="Start Time"
          aria-label={`Start time for ${day}`}
          value={slot.start}
          options={generateTimeOptions(true, slot.end, allSlotsForValidation, slot.id)}
          onChange={(value) => handleTimeChange('start', value)}
          hasError={isIncomplete && !slot.start}
          pairedValue={slot.end}
          isStartTime={true}
        />
      </div>
      <div className="w-full">
        <CustomTimeInput
          placeholder="End Time"
          aria-label={`End time for ${day}`}
          value={slot.end}
          options={generateTimeOptions(false, slot.start, allSlotsForValidation, slot.id)}
          onChange={(value) => handleTimeChange('end', value)}
          hasError={isIncomplete && !slot.end}
          pairedValue={slot.start}
          isStartTime={false}
        />
      </div>
      <button
        type="button"
        aria-label="Remove time slot"
        onClick={() => onRemoveSlot(slot.id)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent text-gray-500 hover:text-gray-800"
      >
        <X className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Add time slot"
        onClick={onAddSlot}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent text-gray-500 hover:text-gray-800"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TimeSlotRow;