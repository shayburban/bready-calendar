
import React, { useState, useEffect } from 'react';
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

export default function TeacherAvailabilityCard({ event, onClose, onDateChange }) {
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
        <DateRangePicker
          singleDate
          singleValue={changeAvailDate}
          onSingleChange={setChangeAvailDate}
          singleLabel="Select Date"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input type="text" placeholder="Select Time" className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input type="text" placeholder="Select Time" className="pl-9" />
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

      <div className="flex gap-3 mt-4">
        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
        <Button className="w-full bg-green-600 hover:bg-green-700">Change Availability</Button>
      </div>
    </div>
  );
}
