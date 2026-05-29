
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// CalendarComponent is replaced by CalendarWithinCalendarCards, so its direct import is removed here.
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, // This is the Lucide icon
  Clock, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Mail, 
  MoreVertical,
  Copy,
  AlertTriangle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import NavigationWithinLegend from './NavigationWithinLegend';
import CalendarWithinCalendarCards from './CalendarWithinCalendarCards';
import DateRangePicker from '../common/DateRangePicker'; // New import

export default function TeacherAvailabilityCard({ event, onClose, onDateChange, savedAvailabilitySlots = [], syncedDayEvents = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWarning, setShowWarning] = useState(true);
  const [activeTimeSlot, setActiveTimeSlot] = useState('');
  // Controlled visibility for the date-picker Popover so a date click can
  // auto-close it (Task 1). Trigger-button click still toggles it via Radix's
  // onOpenChange, and the existing onInteractOutside.preventDefault() on the
  // PopoverContent (intentional) continues to keep outside clicks from closing.
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // "Change Your Availability" → Select Date field (Task 2). Single-date
  // selection driven by the shared DateRangePicker so the field uses the
  // EXACT same UI/styling/calendar logic as the sidebar's Start Date picker.
  const [changeAvailDate, setChangeAvailDate] = useState(null);
  // Task 4 form fields — wired so we can validate completeness AND compute
  // schedule conflicts (Task 5) against existing saved slots / synced events.
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Task 5 — overlap math. Two time ranges overlap iff `aStart < bEnd` AND
  // `bStart < aEnd`. Times are 'HH:MM' strings; we compare by minutes.
  const toMinutes = (t) => {
    if (!t || typeof t !== 'string') return null;
    const [h, m] = t.split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const timesOverlap = (aStart, aEnd, bStart, bEnd) => {
    const aS = toMinutes(aStart);
    const aE = toMinutes(aEnd);
    const bS = toMinutes(bStart);
    const bE = toMinutes(bEnd);
    if (aS === null || aE === null || bS === null || bE === null) return false;
    if (aE <= aS || bE <= bS) return false;
    return aS < bE && bS < aE;
  };

  // YYYY-MM-DD for the currently picked Change-Availability date — used to
  // filter same-day saved/synced events for conflict detection.
  const changeAvailYMD = useMemo(() => {
    if (!changeAvailDate) return null;
    try {
      return format(new Date(changeAvailDate), 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }, [changeAvailDate]);

  // Hard conflicts — overlapping availability slots the teacher already
  // saved internally on the same date. Surfaces a RED alert and forces the
  // submit button into the gray/inactive state (Task 5 hard-overlap rule).
  const internalConflicts = useMemo(() => {
    if (!changeAvailYMD || !startTime || !endTime) return [];
    return (savedAvailabilitySlots || []).filter(
      (s) => s && s.date === changeAvailYMD && timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
  }, [savedAvailabilitySlots, changeAvailYMD, startTime, endTime]);

  // Soft conflicts — external synced-calendar events on the same date.
  // Surfaces a YELLOW alert; the submit button stays ACTIVE/green so the
  // teacher can override (Task 5 soft-overlap rule). Data is supplied
  // via the `syncedDayEvents` prop; defaults to [] when not wired.
  const syncedConflicts = useMemo(() => {
    if (!changeAvailYMD || !startTime || !endTime) return [];
    return (syncedDayEvents || []).filter(
      (s) => s && s.date === changeAvailYMD && timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
  }, [syncedDayEvents, changeAvailYMD, startTime, endTime]);

  const isFormComplete = !!changeAvailDate && !!startTime && !!endTime;
  const hasHardConflict = internalConflicts.length > 0;
  // Button is "active green" only when all fields are filled AND there is
  // no hard internal conflict. Synced (soft) conflicts do NOT block.
  const isSubmitActive = isFormComplete && !hasHardConflict;

  // Task 4 — click handler. CRUCIALLY does not rely on the `disabled`
  // attribute (the button stays clickable so it can surface the error).
  const handleChangeAvailability = () => {
    const missing = [];
    if (!changeAvailDate) missing.push('Select Date');
    if (!startTime) missing.push('Start Time');
    if (!endTime) missing.push('End Time');
    if (missing.length > 0) {
      setValidationErrors(missing);
      return;
    }
    if (hasHardConflict) {
      // The Red alert is already visible; clear the missing-fields error.
      setValidationErrors([]);
      return;
    }
    setValidationErrors([]);
    // Soft (synced) conflicts are explicitly allowed to fall through —
    // teacher override per Task 5. Existing save data flow is unchanged
    // (there is no save call to make here yet; this is a UI placeholder).
  };

  // selectedDate is intentionally driven by event?.dateString ONLY — not the
  // whole `event` reference. Navigating between same-day time-range chips
  // swaps `event` to a sibling that shares the same dateString, so this effect
  // no longer fires and the user's chosen date persists across chip clicks
  // (Task 2). Opening the popup on a different day still updates correctly
  // because dateString actually changes.
  useEffect(() => {
    if (event?.dateString) {
      setSelectedDate(new Date(event.dateString));
    }
  }, [event?.dateString]);

  // activeTimeSlot keeps its prior reset behavior (resyncs whenever the active
  // event swaps), so existing logic that relies on it remains intact.
  useEffect(() => {
    if (event) {
      setActiveTimeSlot(event.timeSlots && event.timeSlots.length > 0 ? event.timeSlots[0] : '');
    }
  }, [event]);

  if (!event) return null;
  
  const roleDisplay = event.role ? `(${event.role})` : '';

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Auto-close the date-picker dropdown immediately on selection (Task 1).
    setDatePickerOpen(false);
    // Lift the date change up to the modal so it can swap the active event
    // context (chips, "Your Availability" text, form details) to match the
    // newly selected day. CalendarWithinCalendarCards passes a full ISO
    // string, which AvailabilityModal's handleDateChange consumes directly.
    if (typeof onDateChange === 'function') {
      onDateChange(date);
    }
    // Here you would typically fetch new event data for the selected date
    console.log("Date selected, new data should be fetched for:", date);
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-center font-bold text-lg text-gray-800">My Availability {roleDisplay}</h3>

      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full text-center font-medium">
                {format(selectedDate, 'dd.MM.yyyy')}
                <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
            <CalendarWithinCalendarCards
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                availableDates={event.availableDatesForCategory || []}
                legendCategory={event.type}
            />
        </PopoverContent>
      </Popover>

      {event.slotHeader || (
        <NavigationWithinLegend
          timeSlots={event.timeSlots || []}
          onSlotSelect={setActiveTimeSlot}
        />
      )}

      <div className="flex justify-end items-center border-b pb-2">
        <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon"><Mail className="w-4 h-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Book For Student</DropdownMenuItem>
            <DropdownMenuItem><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
            <DropdownMenuItem>View As A Student (S)</DropdownMenuItem>
            <DropdownMenuItem>Close Availability</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1">
        <p className="font-bold text-gray-800 underline">Your Availability</p>
        <p className="text-sm text-gray-600">{format(selectedDate, 'dd.MM.yyyy')} | {event.time || activeTimeSlot}</p>
      </div>

      <div className="space-y-3">
        <p className="font-bold text-gray-800 underline mt-4">Change Your Availability</p>
        {/* Responsive grid (Task 4): on mobile, 2 columns — Select Date spans
            both columns on top, Start/End Time sit side-by-side below. At md+
            it switches to 3 equal columns so the three fields share the row. */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <DateRangePicker
              singleDate
              singleValue={changeAvailDate}
              onSingleChange={setChangeAvailDate}
              singleLabel="Select Date"
            />
          </div>
          <div className="col-span-1">
            {/* Label uses the same text-gray-700 / font-medium as the
                DateRangePicker's "Select Date" label so headers line up. */}
            <label className="text-xs font-medium text-gray-700">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              {/* Task 3 — uniform height/padding/border across all three
                  inputs in this grid row (h-10 + border-gray-300 + bg-gray-50)
                  so the Start Time / End Time fields visually match the
                  DateRangePicker's h-10 trigger Button exactly. */}
              <Input
                type="text"
                placeholder="Select Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 pl-9 pr-3 border-gray-300 bg-gray-50"
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="text-xs font-medium text-gray-700">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Select Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 pl-9 pr-3 border-gray-300 bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>
      
      {showWarning && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription className="text-xs">
                You are busy on 21.08.2021 between the time entered.
            </AlertDescription>
            <button onClick={() => setShowWarning(false)} className="absolute top-2 right-2 p-1">
                <X className="h-4 w-4" />
            </button>
        </Alert>
      )}

      {/* Task 5 — Hard conflict (RED) alert. Triggers the gray/inactive
          state on the submit button below. */}
      {hasHardConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflict with an existing availability</AlertTitle>
          <AlertDescription className="text-xs">
            The time you entered overlaps with another availability you've already saved on this date. Please pick a different time before submitting.
          </AlertDescription>
        </Alert>
      )}
      {/* Task 5 — Soft conflict (YELLOW) alert. Button stays ACTIVE/green
          per spec so the teacher can override the external synced event. */}
      {syncedConflicts.length > 0 && (
        <Alert className="bg-yellow-50 border border-yellow-200 text-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertTitle>Warning: This conflicts with a Synced Calendar event</AlertTitle>
          <AlertDescription className="text-xs">
            This time overlaps with an event from your synced external calendar. You can still save and override it.
          </AlertDescription>
        </Alert>
      )}
      {/* Task 4 — inline error surfaced when the user clicks the gray
          submit button with required fields missing. */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          Please fill in the following required field{validationErrors.length > 1 ? 's' : ''}: {validationErrors.join(', ')}.
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
        {/* Task 4 — NO native `disabled` attribute (would block clicks). We
            simulate disabled visually so the button still fires onClick and
            can surface the validation error / hard-conflict messaging. */}
        <Button
          onClick={handleChangeAvailability}
          aria-disabled={!isSubmitActive}
          className={`w-full ${
            isSubmitActive
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
          }`}
        >
          Change Availability
        </Button>
      </div>
    </div>
  );
}
