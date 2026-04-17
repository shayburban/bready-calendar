
import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A reusable global calendar component suitable for embedding in various cards.
 * It adapts its behavior based on the context provided via props.
 *
 * @param {object} props - The component props.
 * @param {Array<string|Date>} props.availableDates - An array of ISO date strings or Date objects that are available for selection.
 * @param {string|Date} props.selectedDate - The currently selected ISO date string or Date object.
 * @param {function(string): void} [props.onDateChange] - Optional callback function triggered when an available date is selected.
 * @param {string} [props.legendCategory] - Optional. Represents the current category/group for filtering (future use).
 */
export default function CalendarWithinCalendarCards({
  availableDates,
  selectedDate,
  onDateChange,
  legendCategory,
}) {
  // Robustly determine the initial date from selectedDate prop, handling strings or Date objects.
  const initialDate = useMemo(() => {
    if (!selectedDate) return new Date();
    try {
      if (selectedDate instanceof Date) return selectedDate;
      if (typeof selectedDate === 'string') return parseISO(selectedDate);
    } catch (e) {
      console.error("Invalid selectedDate prop passed to calendar:", e);
    }
    return new Date();
  }, [selectedDate]);
  
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const parsedSelectedDate = useMemo(() => initialDate, [initialDate]);

  // Robustly create a set of available dates in 'yyyy-MM-dd' format.
  // This now handles an array containing either strings or Date objects.
  const availableDatesSet = useMemo(() => {
    if (!Array.isArray(availableDates)) {
      return new Set();
    }
    const dateStrings = availableDates.map(date => {
      try {
        if (typeof date === 'string') {
          // Handles both 'YYYY-MM-DD' and full 'YYYY-MM-DDTHH:mm:ss.sssZ' formats.
          return date.split('T')[0];
        }
        if (date instanceof Date) {
          return format(date, 'yyyy-MM-dd');
        }
      } catch (error) {
        console.error("Invalid item in availableDates prop:", date, error);
        return null;
      }
      return null;
    }).filter(Boolean); // Filter out any null/invalid entries.
    return new Set(dateStrings);
  }, [availableDates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleDateClick = (day) => {
    const dayISO = format(day, 'yyyy-MM-dd');
    if (availableDatesSet.has(dayISO)) {
      // Defensively check if onDateChange is a function before calling it.
      if (typeof onDateChange === 'function') {
        // Always pass back a full ISO string for consistency.
        onDateChange(day.toISOString());
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="p-3 bg-white rounded-lg shadow-md w-full max-w-xs mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday Grid */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="font-medium">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          // Use format for consistent, timezone-safe 'YYYY-MM-DD' string generation.
          const dayISO = format(day, 'yyyy-MM-dd');
          const isAvailable = availableDatesSet.has(dayISO);
          const isSelected = isSameDay(day, parsedSelectedDate);
          const isDayToday = isToday(day);

          const isDisabled = !isAvailable || !isCurrentMonth;

          let buttonClasses = "h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-colors ";

          if (isDisabled) {
            buttonClasses += "text-gray-300 cursor-not-allowed";
          } else {
            if (isSelected) {
              buttonClasses += "bg-gray-900 text-white font-bold hover:bg-gray-800";
            } else if (isDayToday) {
              buttonClasses += "bg-gray-100 text-gray-900 hover:bg-gray-200";
            } else {
              buttonClasses += "hover:bg-gray-100";
            }
          }

          if (!isCurrentMonth) {
              buttonClasses += " text-gray-300"; // Ghosted days from other months
          }

          return (
            <div key={i} className="flex justify-center">
              <button
                type="button"
                className={buttonClasses}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
