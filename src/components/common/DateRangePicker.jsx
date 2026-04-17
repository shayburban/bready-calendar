import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import { format, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

const DateRangePicker = ({ onRangeChange, onRemove, onAdd, showControls = true, className = "", isOnlyRow = false }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  
  const calendarRef = useRef(null);
  const containerRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) &&
          containerRef.current && !containerRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startCalendar);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const days = generateCalendarDays();
  const today = new Date();
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDateClick = (date) => {
    const selectedDate = startOfDay(date);

    if (selectingStart || !startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (isBefore(selectedDate, startDate)) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      setSelectingStart(true);
      setIsCalendarOpen(false);
    }
  };

  const handleInputClick = (isStart) => {
    setSelectingStart(isStart);
    setIsCalendarOpen(true);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleRemove = () => {
    if (isOnlyRow) {
      // Reset fields instead of removing
      setStartDate(null);
      setEndDate(null);
    } else if (onRemove) {
      onRemove();
    }
  };

  const isInRange = (date) => {
    if (!startDate || !endDate) return false;
    return (isAfter(date, startDate) || isEqual(date, startDate)) && 
           (isBefore(date, endDate) || isEqual(date, endDate));
  };

  const isRangeStart = (date) => startDate && isEqual(date, startDate);
  const isRangeEnd = (date) => endDate && isEqual(date, endDate);
  
  const isPreviewRange = (date) => {
    if (!startDate || endDate || !hoveredDate || selectingStart) return false;
    const start = isBefore(hoveredDate, startDate) ? hoveredDate : startDate;
    const end = isBefore(hoveredDate, startDate) ? startDate : hoveredDate;
    return (isAfter(date, start) || isEqual(date, start)) && 
           (isBefore(date, end) || isEqual(date, end));
  };

  // Notify parent of range changes
  useEffect(() => {
    if (onRangeChange && startDate && endDate) {
      onRangeChange({ startDate, endDate });
    }
  }, [startDate, endDate, onRangeChange]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-2">
        {/* Start Date Field */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Start Date</label>
          <Button
            variant="outline"
            onClick={() => handleInputClick(true)}
            className={`w-full justify-start text-left font-normal h-10 px-3 ${
              startDate ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-500'
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {startDate ? format(startDate, 'MMM d, yyyy') : 'Select Date'}
            </span>
          </Button>
        </div>

        {/* End Date Field */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">End Date</label>
          <Button
            variant="outline"
            onClick={() => handleInputClick(false)}
            className={`w-full justify-start text-left font-normal h-10 px-3 ${
              endDate ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-500'
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {endDate ? format(endDate, 'MMM d, yyyy') : 'Select Date'}
            </span>
          </Button>
        </div>

        {/* Control Buttons */}
        {showControls && (
          <div className="flex flex-col gap-1 pt-5">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </Button>
            {onAdd && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onAdd}
                className="h-6 w-6 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div 
          ref={calendarRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <h3 className="font-medium text-sm">{monthYear}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth(1)}
              className="h-8 w-8 p-0"
            >
              →
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = isEqual(startOfDay(date), startOfDay(today));
              const inRange = isInRange(date);
              const rangeStart = isRangeStart(date);
              const rangeEnd = isRangeEnd(date);
              const previewRange = isPreviewRange(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`
                    h-8 w-8 text-sm rounded transition-all duration-200
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isToday ? 'font-bold' : ''}
                    ${rangeStart || rangeEnd ? 'bg-blue-600 text-white' : ''}
                    ${inRange && !rangeStart && !rangeEnd ? 'bg-blue-100 text-blue-700' : ''}
                    ${previewRange && !rangeStart && !rangeEnd ? 'bg-blue-50 text-blue-600' : ''}
                    ${!inRange && !rangeStart && !rangeEnd && !previewRange ? 'hover:bg-gray-100' : ''}
                    ${isCurrentMonth && !inRange && !rangeStart && !rangeEnd && !previewRange ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selection Info */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            {selectingStart && !startDate && "Select start date"}
            {!selectingStart && startDate && !endDate && "Select end date"}
            {startDate && endDate && "Range selected"}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;