import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus } from 'lucide-react';
import { format, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

const DateRangePicker = ({
  value,
  onRangeChange,
  onRemove,
  onAdd,
  showControls = true,
  className = "",
  isOnlyRow = false,
  noEndDate = false,
  hideRemove = false,
  // ── Single-date mode (additive). When `singleDate` is true the picker
  //    renders a single Start-Date-style field that selects one date and
  //    emits via `onSingleChange`. All range logic, the End Date field,
  //    and the add/remove controls are suppressed. Default behavior
  //    (range mode) is 100% backward-compatible.
  singleDate = false,
  singleValue = null,
  onSingleChange,
  singleLabel = 'Start Date',
  singlePlaceholder = 'DD.MM.YY',
}) => {
  // When `value` is supplied the picker runs in controlled mode — internal
  // state stays in sync with the prop via the useEffect below. When `value`
  // is undefined the picker is uncontrolled (legacy behavior).
  const [startDate, setStartDate] = useState(() =>
    value?.startDate ? startOfDay(new Date(value.startDate)) : null
  );
  const [endDate, setEndDate] = useState(() =>
    value?.endDate ? startOfDay(new Date(value.endDate)) : null
  );

  // Last range we emitted to the parent, as "startMs-endMs". Used to dedupe
  // both directions: we won't re-emit content we already sent, and we won't
  // re-sync from a `value` prop that's just the parent echoing it back.
  // Without this guard, the inline `onRangeChange` arrow in CalendarSidebar
  // gets a fresh reference on every parent render — that triggers our emit
  // effect, which round-trips through the parent and arrives back on `value`
  // with a fresh object reference, which triggers the value-sync effect.
  // If a user pick was in flight during that round-trip the two effects
  // could ping-pong between the freshly-picked value and the prior value.
  const lastEmittedRef = useRef(null);

  useEffect(() => {
    if (value === undefined) return;
    const newStart = value?.startDate ? startOfDay(new Date(value.startDate)) : null;
    const newEnd = value?.endDate ? startOfDay(new Date(value.endDate)) : null;

    // Skip pure echoes of our last emit — same content, different object ref.
    if (newStart && newEnd) {
      const sig = `${newStart.getTime()}-${newEnd.getTime()}`;
      if (sig === lastEmittedRef.current) return;
    }

    setStartDate((prev) => {
      if (prev && newStart && prev.getTime() === newStart.getTime()) return prev;
      if (!prev && !newStart) return prev;
      return newStart;
    });
    setEndDate((prev) => {
      if (prev && newEnd && prev.getTime() === newEnd.getTime()) return prev;
      if (!prev && !newEnd) return prev;
      return newEnd;
    });
  }, [value]);

  // Single-date mode: mirror `singleValue` into the internal `startDate`
  // so the same Start-Date UI/calendar logic visualizes the selection.
  // Dedupe pattern mirrors the value-sync effect above so a parent re-render
  // emitting a freshly-constructed Date object doesn't churn state.
  useEffect(() => {
    if (!singleDate) return;
    const nextDate = singleValue ? startOfDay(new Date(singleValue)) : null;
    setStartDate((prev) => {
      if (prev && nextDate && prev.getTime() === nextDate.getTime()) return prev;
      if (!prev && !nextDate) return prev;
      return nextDate;
    });
  }, [singleDate, singleValue]);

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

  // Two distinct flows depending on which field opened the calendar:
  //   - Start picker (selectingStart === true): update startDate only. Clear
  //     endDate only if the new start is after the existing end (range would
  //     become invalid).
  //   - End picker (selectingStart === false): update endDate only. Never
  //     touch startDate just because the range was already complete — the
  //     prior version's `(startDate && endDate)` short-circuit caused the
  //     start to silently reset whenever the user re-picked an end.
  const handleDateClick = (date) => {
    const selectedDate = startOfDay(date);
    if (isBefore(selectedDate, startOfDay(new Date()))) return;

    // Single-date mode: one click selects the date, closes the calendar,
    // and notifies the parent. None of the range logic below runs.
    if (singleDate) {
      setStartDate(selectedDate);
      setIsCalendarOpen(false);
      if (typeof onSingleChange === 'function') {
        onSingleChange(selectedDate);
      }
      return;
    }

    if (selectingStart) {
      setStartDate(selectedDate);

      if (endDate && isBefore(endDate, selectedDate)) {
        // New start is after the existing end — the old end is no longer
        // valid; clear it and keep the calendar open for the user to pick
        // a fresh end.
        setEndDate(null);
        setSelectingStart(false);
        return;
      }

      if (!endDate) {
        // No end yet — keep calendar open and continue with end selection.
        setSelectingStart(false);
        return;
      }

      // Existing end is still valid; we're done.
      setSelectingStart(true);
      setIsCalendarOpen(false);
      return;
    }

    // End picker flow.
    if (!startDate) {
      // No start yet — treat this click as a start pick instead.
      setStartDate(selectedDate);
      setSelectingStart(false);
      return;
    }

    if (isBefore(selectedDate, startDate)) {
      // Picked an end earlier than start — swap so the range stays valid.
      setEndDate(startDate);
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
    setSelectingStart(true);
    setIsCalendarOpen(false);
  };

  // Range-mode trigger handler. Single-date mode no longer goes through
  // here — its trigger is wrapped in a Radix Popover whose open state is
  // driven directly by isCalendarOpen via onOpenChange.
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

  // Notify parent of range changes — but only when the content actually
  // changes. The dedup via `lastEmittedRef` prevents this effect from
  // re-firing just because `onRangeChange` got a new function reference
  // on a parent re-render (the typical inline-arrow case).
  useEffect(() => {
    // No range to emit in single-date mode — the picker emits via
    // onSingleChange from handleDateClick instead.
    if (singleDate) return;
    if (!onRangeChange || !startDate || !endDate) return;
    const sig = `${startDate.getTime()}-${endDate.getTime()}`;
    if (lastEmittedRef.current === sig) return;
    lastEmittedRef.current = sig;
    onRangeChange({ startDate, endDate });
  }, [startDate, endDate, onRangeChange, singleDate]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-1 min-w-0">
        {/* Start Date Field — in single-date mode this IS the single field,
            wrapped in a Radix Popover so it registers as a DismissableLayer
            BRANCH of the parent Dialog (via React context that propagates
            through portals). That's what makes Radix treat clicks on the
            popover content as INSIDE the modal — the durable fix for the
            previous portal-vs-Dialog "abruptly closes" bug. */}
        <div className="flex-1 min-w-0 space-y-1">
          <label className="text-xs font-medium text-gray-700">{singleDate ? singleLabel : 'Start Date'}</label>
          {singleDate ? (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left h-10 px-3 border-gray-300 ${
                    startDate
                      ? 'bg-gray-50 font-semibold text-gray-900'
                      : 'bg-gray-50 font-normal text-gray-500'
                  }`}
                >
                  <span className="truncate">
                    {startDate ? format(startDate, 'dd.MM.yy') : singlePlaceholder}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={8} className="w-auto p-4">
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
                    const isPast = isBefore(startOfDay(date), startOfDay(today));
                    const inRange = isInRange(date);
                    const rangeStart = isRangeStart(date);
                    const rangeEnd = isRangeEnd(date);
                    const previewRange = isPreviewRange(date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        onMouseEnter={() => !isPast && setHoveredDate(date)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={isPast}
                        className={`
                          h-8 w-8 text-sm rounded transition-all duration-200
                          ${isPast ? 'text-gray-300 cursor-not-allowed opacity-50' : !isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                          ${isToday ? 'font-bold' : ''}
                          ${!isPast && (rangeStart || rangeEnd) ? 'bg-blue-600 text-white' : ''}
                          ${!isPast && inRange && !rangeStart && !rangeEnd ? 'bg-blue-100 text-blue-700' : ''}
                          ${!isPast && previewRange && !rangeStart && !rangeEnd ? 'bg-blue-50 text-blue-600' : ''}
                          ${!isPast && !inRange && !rangeStart && !rangeEnd && !previewRange ? 'hover:bg-gray-100' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Selection Info + Clear Selection (Task 2 spec). */}
                <div className="mt-4 text-xs text-gray-500">
                  <div className="flex items-center justify-between gap-3">
                    <span>{startDate ? 'Date selected' : 'Select date'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartDate(null);
                        if (typeof onSingleChange === 'function') {
                          onSingleChange(null);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleInputClick(true)}
              className={`w-full justify-start text-left h-10 px-3 border-gray-300 ${
                startDate
                  ? 'bg-gray-50 font-semibold text-gray-900'
                  : 'bg-gray-50 font-normal text-gray-500'
              }`}
            >
              <span className="truncate">
                {startDate ? format(startDate, 'dd.MM.yy') : 'DD.MM.YY'}
              </span>
            </Button>
          )}
        </div>

        {/* End Date Field — hidden in single-date mode. When noEndDate is on,
            the field is disabled and shows "∞ (Inf.)". The internal endDate
            state is preserved so unchecking "No end date" automatically
            restores the prior value. */}
        {!singleDate && (
        <div className="flex-1 min-w-0 space-y-1">
          <label className="text-xs font-medium text-gray-700">End Date</label>
          <Button
            variant="outline"
            onClick={() => handleInputClick(false)}
            disabled={noEndDate}
            className={`w-full justify-start text-left h-10 px-3 border-gray-300 ${
              noEndDate
                ? 'bg-gray-100 text-gray-700 font-semibold cursor-not-allowed'
                : endDate
                ? 'bg-gray-50 font-semibold text-gray-900'
                : 'bg-gray-50 font-normal text-gray-500'
            }`}
          >
            <span className="truncate">
              {noEndDate
                ? '\u221E (Inf.)'
                : endDate
                ? format(endDate, 'dd.MM.yy')
                : 'DD.MM.YY'}
            </span>
          </Button>
        </div>
        )}

        {/* Control Buttons \u2014 also hidden in single-date mode. */}
        {!singleDate && showControls && (
          <div className="flex flex-col gap-1 pt-5 flex-shrink-0">
            {!hideRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
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

      {/* Range mode keeps the in-place absolute-positioned calendar so the
          sidebar's behavior is unchanged. Single-date mode now lives inside
          a Radix Popover rendered above (recognized as a Dialog branch). */}
      {isCalendarOpen && !singleDate && (
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
              const isPast = isBefore(startOfDay(date), startOfDay(today));
              const inRange = isInRange(date);
              const rangeStart = isRangeStart(date);
              const rangeEnd = isRangeEnd(date);
              const previewRange = isPreviewRange(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => !isPast && setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={isPast}
                  className={`
                    h-8 w-8 text-sm rounded transition-all duration-200
                    ${isPast ? 'text-gray-300 cursor-not-allowed opacity-50' : !isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isToday ? 'font-bold' : ''}
                    ${!isPast && (rangeStart || rangeEnd) ? 'bg-blue-600 text-white' : ''}
                    ${!isPast && inRange && !rangeStart && !rangeEnd ? 'bg-blue-100 text-blue-700' : ''}
                    ${!isPast && previewRange && !rangeStart && !rangeEnd ? 'bg-blue-50 text-blue-600' : ''}
                    ${!isPast && !inRange && !rangeStart && !rangeEnd && !previewRange ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selection Info. In single-date mode the footer hosts the
              "Clear Selection" text link (relocated from the input per
              Task 2 spec) side-by-side with the hint text. */}
          <div className="mt-4 text-xs text-gray-500">
            {singleDate ? (
              <div className="flex items-center justify-between gap-3">
                <span>{startDate ? 'Date selected' : 'Select date'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStartDate(null);
                    if (typeof onSingleChange === 'function') {
                      onSingleChange(null);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="text-center">
                {selectingStart && !startDate && "Select start date"}
                {!selectingStart && startDate && !endDate && "Select end date"}
                {startDate && endDate && "Range selected"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;