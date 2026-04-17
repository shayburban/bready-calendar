
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
import CalendarWithinCalendarCards from './CalendarWithinCalendarCards'; // New import

export default function TeacherAvailabilityCard({ event, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWarning, setShowWarning] = useState(true);
  const [activeTimeSlot, setActiveTimeSlot] = useState('');

  useEffect(() => {
    if (event) {
      setSelectedDate(new Date(event.dateString || Date.now()));
      setActiveTimeSlot(event.timeSlots && event.timeSlots.length > 0 ? event.timeSlots[0] : '');
    }
  }, [event]);

  if (!event) return null;
  
  const roleDisplay = event.role ? `(${event.role})` : '';

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Here you would typically fetch new event data for the selected date
    console.log("Date selected, new data should be fetched for:", date);
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-center font-bold text-lg text-gray-800">My Availability {roleDisplay}</h3>

      <Popover>
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
                onDateSelect={handleDateSelect}
                availableDates={event.availableDatesForCategory || []}
                legendCategory={event.type}
            />
        </PopoverContent>
      </Popover>

      <NavigationWithinLegend 
        timeSlots={event.timeSlots || []}
        onSlotSelect={setActiveTimeSlot}
      />

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
        <p className="text-sm text-gray-600">{activeTimeSlot} &nbsp;&nbsp; {format(selectedDate, 'dd.MM.yyyy')}</p>
      </div>

      <div className="space-y-3">
        <p className="font-bold text-gray-800 underline mt-4">Change Your Availability</p>
        <div>
          <label className="text-xs font-medium text-gray-600">Select Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder="Select Date" className="pl-9" />
          </div>
        </div>
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
