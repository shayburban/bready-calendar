import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import TimeSlotRow from './TimeSlotRow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Helper function to convert HH:MM time to minutes from midnight
const timeToMinutes = (time24h) => {
  if (!time24h || !time24h.includes(':')) return 0;
  const [hours, minutes] = time24h.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes back to HH:MM format
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const DayScheduleRow = ({
  day,
  dayLabel,
  slots,
  onSlotChange,
  onAddSlot,
  onRemoveSlot,
}) => {
  const [overlapInfo, setOverlapInfo] = useState(null);
  const [invalidTimeInfo, setInvalidTimeInfo] = useState(null);

  useEffect(() => {
    // Check for invalid time order (end time before start time)
    let invalidSlots = [];
    slots.forEach((slot, index) => {
      if (slot.start && slot.end) {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);
        if (endMinutes <= startMinutes) {
          invalidSlots.push(index + 1);
        }
      }
    });

    if (invalidSlots.length > 0) {
      setInvalidTimeInfo({
        rows: invalidSlots,
        message: invalidSlots.length === 1 
          ? `Row ${invalidSlots[0]} has an invalid time range (end time must be after start time).`
          : `Rows ${invalidSlots.join(', ')} have invalid time ranges (end time must be after start time).`
      });
    } else {
      setInvalidTimeInfo(null);
    }

    // Only check for overlaps if all time orders are valid
    if (invalidSlots.length > 0) {
      setOverlapInfo(null);
      return;
    }

    const validSlots = slots
      .map((slot, index) => ({ ...slot, originalIndex: index }))
      .filter(slot => slot.start && slot.end);

    if (validSlots.length < 2) {
      setOverlapInfo(null);
      return;
    }

    // Build adjacency list for overlapping slots
    const adj = new Map(validSlots.map(s => [s.originalIndex, []]));
    for (let i = 0; i < validSlots.length; i++) {
      for (let j = i + 1; j < validSlots.length; j++) {
        const slotA = validSlots[i];
        const slotB = validSlots[j];
        const startA = timeToMinutes(slotA.start);
        const endA = timeToMinutes(slotA.end);
        const startB = timeToMinutes(slotB.start);
        const endB = timeToMinutes(slotB.end);

        if (startA < endB && endA > startB) {
          adj.get(slotA.originalIndex).push(slotB.originalIndex);
          adj.get(slotB.originalIndex).push(slotA.originalIndex);
        }
      }
    }

    // Find all connected components (groups of overlapping slots)
    const visited = new Set();
    const components = [];
    for (const slot of validSlots) {
      if (!visited.has(slot.originalIndex)) {
        const component = [];
        const stack = [slot.originalIndex];
        visited.add(slot.originalIndex);
        while (stack.length > 0) {
          const u = stack.pop();
          component.push(u);
          for (const v of adj.get(u)) {
            if (!visited.has(v)) {
              visited.add(v);
              stack.push(v);
            }
          }
        }
        if (component.length > 1) {
          components.push(component.sort((a, b) => a - b));
        }
      }
    }

    if (components.length > 0) {
      const mainGroup = components[0];
      let minStart = Infinity;
      let maxEnd = -Infinity;
      mainGroup.forEach(index => {
        const s = slots[index];
        minStart = Math.min(minStart, timeToMinutes(s.start));
        maxEnd = Math.max(maxEnd, timeToMinutes(s.end));
      });
      
      let rowListText = mainGroup.map(r => `Row ${r + 1}`).join(', ');
      if (mainGroup.length > 1) {
          const lastCommaIndex = rowListText.lastIndexOf(',');
          if (lastCommaIndex !== -1) {
              rowListText = `${rowListText.substring(0, lastCommaIndex)} and ${rowListText.substring(lastCommaIndex + 1)}`;
          }
      }

      setOverlapInfo({
        rowText: rowListText,
        start: minutesToTime(minStart),
        end: minutesToTime(maxEnd),
      });
    } else {
      setOverlapInfo(null);
    }
  }, [slots]);

  const handleAddSlot = () => {
    onAddSlot(day);
  };

  // If no slots exist, show "Closed" state
  if (!slots || slots.length === 0) {
    return (
      <div className="py-4 border-b">
        <div className="grid grid-cols-3 items-center">
          <div className="col-span-1">
            <label className="font-medium text-gray-700 capitalize">
              {dayLabel}
            </label>
          </div>
          <div className="col-span-1 text-center">
            <span className="text-gray-500">Closed</span>
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              aria-label="Add time slot"
              onClick={handleAddSlot}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b">
      <div className="grid grid-cols-[1fr,2fr] items-start gap-4">
        <div className="pt-2">
          <label className="font-medium text-gray-700 capitalize">
            {dayLabel}
          </label>
        </div>
        <div>
          {slots.map((slot, index) => (
            <TimeSlotRow
              key={slot.id || index}
              day={day}
              slot={{ ...slot, id: slot.id || index }}
              onSlotChange={(slotId, updatedSlot) => onSlotChange(slotId, updatedSlot)}
              onRemoveSlot={() => onRemoveSlot(index)}
              onAddSlot={handleAddSlot}
              allSlotsForValidation={slots}
            />
          ))}
        </div>
      </div>
      {invalidTimeInfo && (
        <Alert variant="destructive" className="mt-2 bg-red-50 border-red-400 text-red-800">
          <AlertTriangle className="h-4 w-4 !text-red-500" />
          <AlertDescription>
            {invalidTimeInfo.message}
          </AlertDescription>
        </Alert>
      )}
      {overlapInfo && !invalidTimeInfo && (
        <Alert variant="destructive" className="mt-2 bg-yellow-50 border-yellow-400 text-yellow-800">
          <AlertTriangle className="h-4 w-4 !text-yellow-500" />
          <AlertDescription>
            Your selected times in Rows {overlapInfo.rowText} overlap. Together, they create <strong>one availability window</strong> from <strong>{overlapInfo.start}</strong> to <strong>{overlapInfo.end}</strong>.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DayScheduleRow;