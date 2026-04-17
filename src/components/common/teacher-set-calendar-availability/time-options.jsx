import { parse } from "date-fns";

// Helper to convert 24-hour format string to a total number of minutes from midnight
const timeToMinutes = (time24h) => {
    if (!time24h) return 0;
    const date = parse(time24h, 'HH:mm', new Date());
    return date.getHours() * 60 + date.getMinutes();
};

export const generateTimeOptions = (isStartTime, otherTime, allSlots = [], currentSlotId = null) => {
    const options = [];
    // Generate time options in 30-minute intervals in 24-hour format
    for (let i = 0; i < 48; i++) {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        options.push({
            value: timeString,
            label: timeString,
        });
    }

    // Apply disabled logic based on otherTime and existing slots
    return options.map(option => {
        const optionInMinutes = timeToMinutes(option.value);
        let isDisabled = false;

        // Check against the paired time (start/end) in the same slot
        if (otherTime) {
            const otherTimeInMinutes = timeToMinutes(otherTime);
            if (isStartTime) {
                // For a start time, disable options that are at or after the end time
                isDisabled = optionInMinutes >= otherTimeInMinutes;
            } else {
                // For an end time, disable options that are at or before the start time
                isDisabled = optionInMinutes <= otherTimeInMinutes;
            }
        }

        // Check against all other slots for overlap prevention
        if (!isDisabled && allSlots && allSlots.length > 0) {
            isDisabled = allSlots.some(slot => {
                // Don't compare against the current slot being edited
                if (slot.id === currentSlotId) return false;
                // Skip incomplete slots
                if (!slot.start || !slot.end) return false;

                const slotStartMinutes = timeToMinutes(slot.start);
                const slotEndMinutes = timeToMinutes(slot.end);

                // Check if this option would create an overlap
                if (isStartTime) {
                    // For start time: option cannot be within an existing slot range
                    return optionInMinutes >= slotStartMinutes && optionInMinutes < slotEndMinutes;
                } else {
                    // For end time: option cannot be within an existing slot range
                    return optionInMinutes > slotStartMinutes && optionInMinutes <= slotEndMinutes;
                }
            });
        }

        return { ...option, disabled: isDisabled };
    });
};

// Enhanced overlap detection that checks against all slots in the same day
export const isTimeDisabled = (time, allSlots, currentSlotId, isStartTime) => {
    if (!time) return false;

    const currentTimeInMinutes = timeToMinutes(time);

    return allSlots.some(slot => {
        // Don't compare a slot against itself
        if (slot.id === currentSlotId) return false;
        // Skip if the slot is incomplete
        if (!slot.start || !slot.end) return false;

        const startInMinutes = timeToMinutes(slot.start);
        const endInMinutes = timeToMinutes(slot.end);

        // Enhanced overlap detection
        if (isStartTime) {
            // A start time is invalid if it falls within an existing slot's range
            return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes < endInMinutes;
        } else {
            // An end time is invalid if it falls within an existing slot's range
            return currentTimeInMinutes > startInMinutes && currentTimeInMinutes <= endInMinutes;
        }
    });
};

// Enhanced time validation for 24-hour format
export const validateTimeInput = (hours, minutes) => {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    // Validate hours (00-23)
    if (isNaN(h) || h < 0 || h > 23) return false;
    
    // Validate minutes (00-59)
    if (isNaN(m) || m < 0 || m > 59) return false;
    
    return true;
};

// Smart hour validation based on first digit
export const getValidSecondHourDigits = (firstDigit) => {
    const first = parseInt(firstDigit, 10);
    if (first === 0 || first === 1) {
        return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    } else if (first === 2) {
        return ['0', '1', '2', '3'];
    }
    return [];
};

// Validate minutes input
export const getValidSecondMinuteDigits = (firstDigit) => {
    const first = parseInt(firstDigit, 10);
    if (first >= 0 && first <= 5) {
        return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    }
    return [];
};

// Check if end time is after start time
export const validateTimeOrder = (startTime, endTime) => {
    if (!startTime || !endTime) return true; // Allow incomplete slots
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    return endMinutes > startMinutes;
};