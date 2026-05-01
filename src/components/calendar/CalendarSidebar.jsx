
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown, Plus, X, Clock, Info, DollarSign, CheckCircle2, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import DateRangePicker from '../common/DateRangePicker';
import CalendarTaskManagerPanel from './CalendarTaskManagerPanel';
import CalendarSetPricePanel from './CalendarSetPricePanel';
import CalendarNewBookingPanel from './CalendarNewBookingPanel';
import { User } from '@/api/entities';
import { AppRole } from '@/api/entities';

// Master category definitions - static internal structure
// Each category has a 'perspectives' array indicating which role_ids (from AppRole) it applies to.
const MASTER_CALENDAR_CATEGORIES = [
{ key: 'not-reviewed', text: 'Not Reviewed', color: 'bg-red-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'booked', text: 'Booked', color: 'bg-orange-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'availability', text: 'Availability', color: 'bg-green-500', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'completed', text: 'Completed', icon: <DollarSign className="w-4 h-4" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'cancelled', text: 'Cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'synced', text: 'Synced Calendar Events', color: 'bg-blue-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'seq-saved', text: 'Sequence Saved', color: 'bg-orange-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'seq-edited', text: 'Sequence Edited', color: 'bg-green-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'waiting', text: 'Waiting For Confirmation', color: 'bg-pink-200', perspectives: ['teacher-t'], defaultChecked: false }];


const LegendItem = ({ color, text, icon, checked, isHeader, onCheckedChange, itemKey }) =>
<li className="flex items-center text-sm text-gray-700 py-1">
    {isHeader ?
  <span className="flex-grow font-semibold">{text}</span> :

  <>
        {/* Render color dot only if 'color' prop exists and not an icon */}
        {color && !icon && <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>}
        {/* Render icon if 'icon' prop exists */}
        {icon && <div className="mr-3">{icon}</div>}
        <span className="flex-grow">{text}</span>
        {checked !== undefined && checked !== null && // Render checkbox only if 'checked' prop is explicitly defined
    <Checkbox
      checked={checked}
      onCheckedChange={(newChecked) => onCheckedChange(itemKey, newChecked)}
      aria-label={`Toggle ${text} events`} // Accessibility
      className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
    }
      </>
  }
  </li>;


const ActionTab = ({ activeTab, tabName, label, setActiveTab }) =>
<Button
  variant={activeTab === tabName ? 'solid' : 'outline'}
  onClick={() => setActiveTab(tabName)}
  className={`w-full justify-center ${activeTab === tabName ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>

        {label}
    </Button>;


// HH dropdown shows 00–23. MM dropdown is restricted to {00,15,30,45} so the
// user can only ever pick a 15-minute boundary (no free-text typing).
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

// HH:MM picker built from two Selects. When `minTime` is set, only options
// strictly later than `minTime` are rendered — used by End Time so the user
// physically cannot pick a time at or before Start Time.
// After the user picks an Hour, the Minute dropdown opens automatically so
// they can complete the time without a second click on the MM trigger.
const TimeSelect = ({ value, onChange, minTime, invalid, disabled }) => {
  const [hour = '', minute = ''] = value ? value.split(':') : [];
  const [hourOpen, setHourOpen] = useState(false);
  const [minuteOpen, setMinuteOpen] = useState(false);

  const isAfter = (h, m) => {
    if (!minTime) return true;
    return `${h}:${m}` > minTime;
  };

  const hourOptions = HOUR_OPTIONS.filter((h) => MINUTE_OPTIONS.some((m) => isAfter(h, m)));
  const minuteOptions = hour
    ? MINUTE_OPTIONS.filter((m) => isAfter(hour, m))
    : MINUTE_OPTIONS;

  const handleHour = (newHour) => {
    let newMinute = minute || '00';
    if (!isAfter(newHour, newMinute)) {
      newMinute = MINUTE_OPTIONS.find((m) => isAfter(newHour, m)) || newMinute;
    }
    onChange(`${newHour}:${newMinute}`);
    // Auto-transition: close Hour, then open Minute on the next tick so the
    // user can pick MM without a second trigger click.
    setHourOpen(false);
    setTimeout(() => setMinuteOpen(true), 0);
  };

  const handleMinute = (newMinute) => {
    const h = hour || '00';
    onChange(`${h}:${newMinute}`);
    setMinuteOpen(false);
  };

  return (
    <div className={`flex items-center gap-1 min-w-0 ${invalid ? 'rounded ring-1 ring-red-500' : ''}`}>
      <Select
        value={hour}
        onValueChange={handleHour}
        open={hourOpen}
        onOpenChange={setHourOpen}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 px-2 min-w-0 flex-1">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-gray-500 text-sm flex-shrink-0">:</span>
      <Select
        value={minute}
        onValueChange={handleMinute}
        open={minuteOpen}
        onOpenChange={setMinuteOpen}
        disabled={disabled || !hour}
      >
        <SelectTrigger className="h-9 px-2 min-w-0 flex-1">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Start/End time row. End-time picker filters out any option <= start (strict
// chronological validation). If the user changes Start to something at/after
// the current End, End is cleared so they re-pick a valid value.
const TimeAvailabilityRow = ({ row, onChange, onRemove, onAdd, canRemove }) => {
  const isInvalid = !!(row.startTime && row.endTime && row.endTime <= row.startTime);
  return (
    <div className="flex items-center gap-1 min-w-0">
      <div className="flex-1 min-w-0">
        <TimeSelect
          value={row.startTime}
          onChange={(newStart) => {
            if (row.endTime && newStart >= row.endTime) {
              onChange({ ...row, startTime: newStart, endTime: '' });
            } else {
              onChange({ ...row, startTime: newStart });
            }
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <TimeSelect
          value={row.endTime}
          onChange={(newEnd) => onChange({ ...row, endTime: newEnd })}
          minTime={row.startTime}
          invalid={isInvalid}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        className="h-8 w-8 p-0 flex-shrink-0 text-gray-500 hover:bg-gray-100"
      >
        <X className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="h-8 w-8 p-0 flex-shrink-0 text-gray-500 hover:bg-gray-100"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};


// Only these legend categories are filterable via a checkbox; the rest are
// always visible on the calendar (no checkbox shown next to them).
const CHECKABLE_LEGEND_KEYS = ['not-reviewed', 'completed', 'cancelled'];

// Function to get initial active keys based on defaultChecked property
const getInitialActiveLegendKeys = () => {
  return MASTER_CALENDAR_CATEGORIES.
  filter((category) => CHECKABLE_LEGEND_KEYS.includes(category.key) && category.defaultChecked).
  map((category) => category.key);
};

// Weekday filter: index uses JS Date#getDay() — 0=Sun … 6=Sat. By default all
// seven are active, so every day inside the blue range is "selected." Unchecking
// a weekday excludes any date with that getDay() from the highlight.
const WEEKDAY_OPTIONS = [
  { idx: 0, label: 'Sun' },
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
];

export default function CalendarSidebar({ view, setView, onLegendFilterChange, onAvailabilityRangesChange, primaryRangeValue, onPrimaryRangeChange, onActiveWeekdaysChange, onSaveAvailability, onNoEndDateChange }) {
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  // Active weekday indices for the "Advanced date selection" filter. Default
  // all seven on so the blue range covers every day until the user narrows it.
  const [activeWeekdays, setActiveWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [activeTab, setActiveTab] = useState('setavail');
  const [dateRanges, setDateRanges] = useState([{ id: 1 }]);
  // Resolved {startDate, endDate} for each row id, only set once both ends
  // are picked. Aggregated and emitted to parent for the blue availability
  // overlay on the monthly calendar.
  const [rangesById, setRangesById] = useState({});
  const [timeRanges, setTimeRanges] = useState([{ id: 1, startTime: '', endTime: '' }]);
  // 'open' = save the current range as Available; 'closed' = remove any saved
  // Open slots in the current range. The toggle is committed by Save Dates.
  const [availabilityMode, setAvailabilityMode] = useState('open');
  // When checked, the date range is treated as open-ended (we cap iteration
  // at +12 months from the start to keep the slot generation finite).
  const [noEndDate, setNoEndDate] = useState(false);
  // When checked (default), Save Dates emits per-time slots; when unchecked,
  // it emits all-day slots (no startTime/endTime).
  const [timeAvailEnabled, setTimeAvailEnabled] = useState(true);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [user, setUser] = useState(null); // Retained state but not used in new legend logic
  const [appRoles, setAppRoles] = useState([]); // Retained state but not used in new legend logic
  const [legendItems, setLegendItems] = useState([]);
  const [loadingLegend, setLoadingLegend] = useState(true);

  // New state to manage active (checked) legend filters - ensure defaults are checked
  const [activeLegendKeys, setActiveLegendKeys] = useState(getInitialActiveLegendKeys);

  useEffect(() => {
    const initializeLegend = async () => {
      setLoadingLegend(true);
      try {
        // Always show the complete legend with headers for teachers
        const generatedItems = [];

        // Add role headers - always show these for teacher calendar
        generatedItems.push({
          key: 'header-teacher',
          text: 'As A Teacher (T)',
          isHeader: true
        });

        generatedItems.push({
          key: 'header-student',
          text: 'As A Student (S)',
          isHeader: true
        });

        // Add all categories - show all legend items. Only the 3 filterable
        // categories carry the `checked` prop (which is what triggers the
        // checkbox to render in LegendItem); the rest pass `checked: undefined`.
        MASTER_CALENDAR_CATEGORIES.forEach((category) => {
          const isCheckable = CHECKABLE_LEGEND_KEYS.includes(category.key);
          generatedItems.push({
            key: category.key,
            text: category.text,
            color: category.color,
            icon: category.icon,
            checked: isCheckable ? category.defaultChecked : undefined,
            isHeader: false
          });
        });

        setLegendItems(generatedItems);

        // Set the initial active keys: only the filterable categories that are defaultChecked.
        const initialActiveKeysForLegend = MASTER_CALENDAR_CATEGORIES.
        filter((category) => CHECKABLE_LEGEND_KEYS.includes(category.key) && category.defaultChecked).
        map((category) => category.key);
        setActiveLegendKeys(initialActiveKeysForLegend);

      } catch (error) {
        console.error("Failed to initialize legend:", error);
        // Fallback: Show complete legend anyway with correct defaultChecked items
        const fallbackItems = [
        { key: 'header-teacher', text: 'As A Teacher (T)', isHeader: true },
        { key: 'header-student', text: 'As A Student (S)', isHeader: true },
        { key: 'not-reviewed', color: 'bg-red-500', text: 'Not Reviewed', checked: true, isHeader: false },
        { key: 'booked', color: 'bg-orange-500', text: 'Booked', isHeader: false },
        { key: 'availability', color: 'bg-green-500', text: 'Availability', isHeader: false },
        { key: 'completed', icon: <DollarSign className="w-4 h-4" />, text: 'Completed', checked: true, isHeader: false },
        { key: 'cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, text: 'Cancelled', checked: true, isHeader: false },
        // (booked/availability/synced/seq-*/waiting intentionally lack a `checked` field — no checkbox rendered)
        { key: 'synced', color: 'bg-blue-500', text: 'Synced Calendar Events', isHeader: false },
        { key: 'seq-saved', color: 'bg-orange-400', text: 'Sequence Saved', isHeader: false },
        { key: 'seq-edited', color: 'bg-green-400', text: 'Sequence Edited', isHeader: false },
        { key: 'waiting', color: 'bg-pink-200', text: 'Waiting For Confirmation', isHeader: false }];

        setLegendItems(fallbackItems);
        setActiveLegendKeys(['not-reviewed', 'completed', 'cancelled']); // Hardcode initial active keys for fallback
      } finally {
        setLoadingLegend(false);
      }
    };

    // Note: User.me() and AppRole.list() are no longer called here as the legend logic no longer depends on them.
    // If these are needed for other parts of CalendarSidebar, they should be fetched separately.
    initializeLegend();
  }, []);

  // New useEffect for propagating filter changes to parent component
  useEffect(() => {
    if (onLegendFilterChange) {
      onLegendFilterChange(activeLegendKeys);
    }
  }, [activeLegendKeys, onLegendFilterChange]);

  // Emit aggregated availability ranges to parent (TeacherCalendar) so
  // the monthly grid can render a blue overlay on the matching dates.
  useEffect(() => {
    if (onAvailabilityRangesChange) {
      onAvailabilityRangesChange(Object.values(rangesById));
    }
  }, [rangesById, onAvailabilityRangesChange]);

  // Emit active weekday filter to parent so the blue range respects it.
  useEffect(() => {
    if (onActiveWeekdaysChange) {
      onActiveWeekdaysChange(activeWeekdays);
    }
  }, [activeWeekdays, onActiveWeekdaysChange]);

  // Emit "no end date" flag to parent so the blue overlay can extend through
  // the entire visible calendar (including months loaded via Show More).
  useEffect(() => {
    if (onNoEndDateChange) {
      onNoEndDateChange(noEndDate);
    }
  }, [noEndDate, onNoEndDateChange]);

  const toggleWeekday = (idx, checked) => {
    setActiveWeekdays((prev) => {
      if (checked) return [...new Set([...prev, idx])].sort();
      return prev.filter((d) => d !== idx);
    });
  };

  // Handle checkbox changes from LegendItem
  const handleLegendCheckedChange = (itemKey, newChecked) => {
    setActiveLegendKeys((prevKeys) => {
      if (newChecked) {
        return [...new Set([...prevKeys, itemKey])]; // Add key if checked
      } else {
        return prevKeys.filter((key) => key !== itemKey); // Remove key if unchecked
      }
    });
  };

  const addDateRange = () => {
    const newId = Math.max(...dateRanges.map((r) => r.id), 0) + 1;
    setDateRanges([...dateRanges, { id: newId }]);
  };

  const removeDateRange = (idToRemove) => {
    if (dateRanges.length === 1) {
      return;
    }
    setDateRanges(dateRanges.filter((range) => range.id !== idToRemove));
    setRangesById((prev) => {
      const next = { ...prev };
      delete next[idToRemove];
      return next;
    });
  };

  const handleRowRangeChange = (id, rangeData) => {
    setRangesById((prev) => ({ ...prev, [id]: rangeData }));
  };

  const updateTimeRange = (id, next) => {
    setTimeRanges((prev) => prev.map((r) => (r.id === id ? next : r)));
  };
  const addTimeRange = () => {
    setTimeRanges((prev) => {
      const newId = Math.max(0, ...prev.map((r) => r.id)) + 1;
      return [...prev, { id: newId, startTime: '', endTime: '' }];
    });
  };
  const removeTimeRange = (id) => {
    setTimeRanges((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  // Build the slot list from the selected ranges/weekdays/times and emit it to
  // the parent. In 'open' mode this saves new availability; in 'closed' mode
  // the parent removes matching saved slots from its store.
  const handleSave = () => {
    const ranges = [primaryRangeValue, ...Object.values(rangesById)]
      .filter((r) => r && r.startDate && (r.endDate || noEndDate));
    if (ranges.length === 0) return;

    // Only times where end >= start are usable. Invalid rows are skipped.
    const validTimes = timeAvailEnabled
      ? timeRanges.filter(
          (t) => t.startTime && t.endTime && t.startTime < t.endTime
        )
      : [];

    const dateKeys = [];
    ranges.forEach((range) => {
      const start = new Date(range.startDate); start.setHours(0, 0, 0, 0);
      let end;
      if (noEndDate) {
        // Cap iteration at +12 months so slot generation is finite.
        end = new Date(start);
        end.setMonth(end.getMonth() + 12);
      } else {
        end = new Date(range.endDate); end.setHours(0, 0, 0, 0);
      }
      const cur = new Date(start);
      while (cur.getTime() <= end.getTime()) {
        if (activeWeekdays.includes(cur.getDay())) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          dateKeys.push(`${yyyy}-${mm}-${dd}`);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    if (dateKeys.length === 0) return;

    let slots;
    if (availabilityMode === 'open') {
      // Full-day default: when Time Availability is unchecked OR no valid
      // time rows are filled in, treat the entire day as open (00:00-23:59).
      if (timeAvailEnabled && validTimes.length > 0) {
        slots = dateKeys.flatMap((date) =>
          validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
        );
      } else {
        slots = dateKeys.map((date) => ({ date, startTime: '00:00', endTime: '23:59' }));
      }
    } else {
      // Closed mode: if user specified times, target those exact slots;
      // otherwise emit a date-only entry that wildcard-matches all slots
      // saved on that date.
      slots = dateKeys.flatMap((date) =>
        validTimes.length
          ? validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
          : [{ date }]
      );
    }

    if (onSaveAvailability) onSaveAvailability(slots, availabilityMode);
  };

  const handleViewChange = (newView) => {
    if (newView === 'Month') {
      window.location.href = createPageUrl('TeacherCalendar');
    } else if (newView === 'Week') {
      window.location.href = createPageUrl('TeacherCalendarWeekly');
    }
    setView(newView);
  };

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Teacher Calendar</h3>
                    <Select value={view} onValueChange={handleViewChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Month">Month</SelectItem>
                            <SelectItem value="Week">Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div>
                    <Button
            variant="ghost"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full justify-start px-2 text-gray-800 font-bold hover:bg-gray-100">

                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isLegendOpen ? '' : '-rotate-90'}`} />
                        Legend
                    </Button>
                    {isLegendOpen &&
          <ul className="mt-2 pl-4 space-y-1">
                            {loadingLegend ?
            <li className="text-sm text-gray-500">Loading...</li> :

            legendItems.map((item) =>
            <LegendItem
              key={item.key}
              itemKey={item.key} // Pass itemKey for callback
              color={item.color}
              text={item.text}
              icon={item.icon}
              isHeader={item.isHeader}
              // Pass checked prop only if the item is supposed to have a checkbox
              checked={item.checked !== undefined ? activeLegendKeys.includes(item.key) : undefined}
              onCheckedChange={handleLegendCheckedChange} />

            )
            }
                        </ul>
          }
                </div>

                <div className="space-y-2">
                    <ActionTab activeTab={activeTab} tabName="setprice" label="Set Price" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="book" label="New Booking" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="task" label="Task Manager" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="setavail" label="Set Availability (T)" setActiveTab={setActiveTab} />
                </div>

                {activeTab === 'setavail' &&
        <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-gray-800">Set Availability</h4>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                Open or close for booking
                                <span
                                  className="ml-1 inline-flex"
                                  title={"Open/Closed Buttons: Select 'Open' to make your selected dates and times available for student bookings. Select 'Closed' to block these dates/times and make them unavailable.\n\nAvailability (T) Meaning: By opening 'Availability (T)', students can automatically book meetings without your manual approval. You are strictly obligated to attend any sessions booked during these hours."}
                                >
                                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                </span>
                            </label>
                            <div className="flex space-x-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => setAvailabilityMode('open')}
                                  className={availabilityMode === 'open' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant={availabilityMode === 'closed' ? 'default' : 'outline'}
                                  onClick={() => setAvailabilityMode('closed')}
                                  className={availabilityMode === 'closed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                >
                                  Closed
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Date Availability</label>
                            <div className="space-y-3 mt-2">
                                {dateRanges.map((range, index) =>
              <DateRangePicker
                key={range.id}
                value={index === 0 ? primaryRangeValue : undefined}
                onRemove={() => removeDateRange(range.id)}
                onAdd={index === dateRanges.length - 1 ? addDateRange : null}
                onRangeChange={(rangeData) =>
                  index === 0
                    ? (onPrimaryRangeChange && onPrimaryRangeChange(rangeData))
                    : handleRowRangeChange(range.id, rangeData)
                }
                noEndDate={noEndDate}
                hideRemove={index === 0}
                isOnlyRow={dateRanges.length === 1} />

              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                                <Checkbox
                                  id="no-end-date"
                                  checked={noEndDate}
                                  onCheckedChange={(c) => setNoEndDate(c === true)}
                                />
                                <label htmlFor="no-end-date" className="text-sm font-medium text-gray-700">No end date</label>
                            </div>
                        </div>

                        <div>
                            <Button
                              variant="ghost"
                              onClick={() => setIsAdvancedOpen((o) => !o)}
                              className="w-full justify-start p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            >
                                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isAdvancedOpen ? '' : '-rotate-90'}`} /> Advanced date selection
                            </Button>
                            {isAdvancedOpen && (
                              <div className="mt-2 ml-5 grid grid-cols-2 gap-x-3 gap-y-1">
                                {WEEKDAY_OPTIONS.map((opt) => (
                                  <label
                                    key={opt.idx}
                                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={activeWeekdays.includes(opt.idx)}
                                      onCheckedChange={(c) => toggleWeekday(opt.idx, c === true)}
                                      aria-label={`Toggle ${opt.label}`}
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                              id="time-avail"
                              checked={timeAvailEnabled}
                              onCheckedChange={(c) => setTimeAvailEnabled(c === true)}
                            />
                            <label htmlFor="time-avail" className="text-sm font-medium text-gray-700">Time Availability</label>
                            <span
                              className="inline-flex"
                              title="Set specific time ranges within your selected dates when you'll be available for bookings. Add multiple ranges per day (e.g., 09:00–12:00 and 14:00–18:00). Times use 15-minute increments only (00, 15, 30, 45) and End Time must be strictly after Start Time. Uncheck this box to leave the entire day open (00:00–23:59)."
                            >
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </span>
                        </div>
                        {timeAvailEnabled && (
                        <div className="space-y-2">
                            {timeRanges.map((row, idx) => (
            <TimeAvailabilityRow
              key={row.id}
              row={row}
              onChange={(next) => updateTimeRange(row.id, next)}
              onRemove={idx === 0 ? () => setTimeAvailEnabled(false) : () => removeTimeRange(row.id)}
              onAdd={addTimeRange}
              canRemove={true}
            />
            ))}
                        </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                            <h5 className="font-bold text-gray-800">Changes will be made to the following dates & hours:</h5>
                            <div>
                                <h6 className="font-semibold">Dates:</h6>
                                <p>20.06.21 – 21.10.21 (every day)</p>
                                <p>20.11.21 – 21.12.21 (Su, Mo, We, Th, Sa)</p>
                            </div>
                            <div>
                                <h6 className="font-semibold">Timings For All Dates:</h6>
                                <p>12:00 – 17:00, 19:00 - 22:00</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full">Cancel</Button>
                            <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">Save Dates</Button>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Last Updated: Today</p>
                            <p className="text-sm text-green-600 font-medium flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Your Calendar is Updated
                            </p>
                        </div>
                    </div>
        }
                
                {activeTab === 'task' && <CalendarTaskManagerPanel />}

                {activeTab === 'setprice' && <CalendarSetPricePanel />}

                {activeTab === 'book' && <CalendarNewBookingPanel />}

                {activeTab !== 'setavail' && activeTab !== 'task' && activeTab !== 'setprice' && activeTab !== 'book' && <div className="text-center p-4 border rounded-lg text-gray-500">Content for {activeTab}</div>}

            </div>

             <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingPreferences(!isEditingPreferences)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                            Availability Window <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center">
                            How far in advance can students book? <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center">
                            Break after a class <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                {isEditingPreferences &&
        <div className="flex justify-end pt-2">
                         <Button size="sm" onClick={() => setIsEditingPreferences(false)}>Save</Button>
                    </div>
        }
            </div>
        </aside>);

}