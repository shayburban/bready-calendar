import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  Pencil,
  Trash2,
} from 'lucide-react';

const TIP =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever";

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DEFAULT_ACTIVE = new Set([1, 2, 3]); // M, T, W

function InfoTip({ text = TIP }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] font-semibold text-gray-500 hover:border-gray-600 hover:text-gray-700"
            aria-label="Info">
            i
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DateField({ label = 'Date', value }) {
  return (
    <div className="flex-1 min-w-[9rem]">
      <Label className="text-sm mb-1 block">{label}</Label>
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input key={value || 'empty'} type="date" className="pl-9" defaultValue={value || ''} />
      </div>
    </div>
  );
}

function TimeField({ label }) {
  return (
    <div className="flex-1 min-w-[9rem]">
      <Label className="text-sm mb-1 block">{label}</Label>
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input type="time" className="pl-9" />
      </div>
    </div>
  );
}

function RepeatBlock({ showMeetingsAndCost }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => new Set(DEFAULT_ACTIVE));
  const toggle = (i) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-gray-900">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          Repeat
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-gray-50 rounded-md p-3 text-sm text-gray-700 space-y-3">
        <div className="flex gap-2">
          {WEEKDAY_LETTERS.map((letter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`h-8 w-8 rounded-full text-sm font-semibold border ${
                active.has(i)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}>
              {letter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-gray-700">Repeat For:</span>
          <Input defaultValue="12" className="w-20" />
          <span>Weeks</span>
        </div>
        <p><span className="font-semibold text-gray-700">First Date:</span> 10th October.</p>
        <p><span className="font-semibold text-gray-700">Last Date:</span> 10th October.</p>
        <p><span className="font-semibold text-gray-700">No. of Hours:</span> 15</p>
        {showMeetingsAndCost && (
          <p><span className="font-semibold text-gray-700">No. Of Meetings:</span> 3</p>
        )}
        <p><span className="font-semibold text-gray-700">No. of Days:</span> 5</p>
        {showMeetingsAndCost && (
          <p><span className="font-semibold text-gray-700">Total Sequence Cost:</span> 10$ * 15hr. = 150$</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function MoreSearchOptions() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          More Search Options
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-gray-50 rounded-md p-3 text-sm space-y-1">
        <Label>Student Unique No.</Label>
        <Input placeholder="12- Shay B" />
      </CollapsibleContent>
    </Collapsible>
  );
}

function SelectedChip() {
  return (
    <div className="flex items-start gap-2">
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-semibold">
        P
      </span>
      <div className="text-sm">
        <p>Prateek K - 9902</p>
        <p>Engineering Entrance Coaching</p>
      </div>
    </div>
  );
}

function SequenceCard() {
  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-700">Sequence 1:</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <p className="font-semibold text-gray-700">Interview Preparation</p>
      <div className="text-sm text-gray-600">
        <p>Su, Mo, <span className="opacity-50">Tu</span>, We, Th, <span className="opacity-50">Fr</span>, Sa</p>
        <p>3rd July 2021 - 10th Oct. 2021</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>10:00 - 12:00</span>
        <span className="inline-flex items-center gap-1">
          <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">1</span>
          Hr.
        </span>
        <span className="font-semibold">150$</span>
      </div>
      <div className="text-sm">
        <p className="font-semibold text-gray-700">Not incuded</p>
        <p className="text-gray-600">3,4,5 July 21</p>
        <p className="text-gray-600">10,13,15 Sep 21</p>
      </div>
      <div className="bg-red-50 text-red-700 rounded-md p-2 text-sm">
        Sequence 1 deleted! <a href="#" className="text-blue-600 underline">Undo</a>
      </div>
    </div>
  );
}

function CostSummary() {
  return (
    <div className="border-t border-b py-3 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold text-gray-700">Subtotal:</span>
        <span>9Hrs. 3 Meetings 3 Days</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 flex items-center">Calculation<InfoTip />:</span>
        <span>9Hrs. = 300$</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 flex items-center">Added Taxes (18%)<InfoTip />:</span>
        <span>20$</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 flex items-center">Cancellation Fees (30%)<InfoTip />:</span>
        <span>20$</span>
      </div>
      <p className="text-xs text-gray-500">(Free Cancellation before 23:59 on 10 Dec. 2021)</p>
      <div className="flex justify-between pt-2 border-t">
        <span className="font-semibold text-gray-700">Total Cost:</span>
        <span><span className="text-blue-600 font-semibold">300$</span> <span className="text-gray-500 text-xs">USD</span></span>
      </div>
    </div>
  );
}

function OpenAvailabilityPane({ onClose, selectedDate }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <DateField label="Date" value={selectedDate} />
      </div>
      <div className="flex flex-wrap gap-2">
        <TimeField label="Start Time" />
        <TimeField label="End Time" />
      </div>
      <RepeatBlock showMeetingsAndCost={false} />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> You are busy on 21.08.2021, 21.08.2021,
          21.08.2021 betwen the time entered.
        </AlertDescription>
      </Alert>
      <p className="text-right text-sm">
        <a href="#" className="text-blue-600 underline">Click Here</a> To Skip Those Dates
      </p>
      <p className="font-semibold text-gray-800">Changes will be made to the following dates & hours:</p>
      <div className="text-sm text-gray-700 space-y-2">
        <p className="font-semibold text-gray-700">Dates:</p>
        <p>
          20 June 2021 – 21 Oct 2021 (every day)<br />
          24 – 27 July 2021 (every day)
        </p>
        <p>
          20 Nov 2021 – 21 Dec 2021<br />
          (Su, Mo, <span className="opacity-50">Tu</span>, We, Th, <span className="opacity-50">Fr</span>, Sa)
        </p>
        <p className="font-semibold text-gray-700">Timings For All Dates:</p>
        <p>12:00 – 17:00</p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">Open Availability</Button>
      </div>
    </div>
  );
}

function NewBookingPane({ onClose, selectedDate }) {
  return (
    <div className="space-y-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select Booking Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="other-teacher">Other Teacher (S)</SelectItem>
          <SelectItem value="known-student">Known Student (T)</SelectItem>
          <SelectItem value="new-student">New Student (T)</SelectItem>
        </SelectContent>
      </Select>
      <div>
        <Label className="text-sm mb-1 block">Student Name</Label>
        <Input type="search" placeholder="Enter Student Name" />
      </div>
      <MoreSearchOptions />
      <SelectedChip />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> can choose only one teacher.
        </AlertDescription>
      </Alert>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose a Service" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="online">Online Class</SelectItem>
          <SelectItem value="consulting">Consulting</SelectItem>
          <SelectItem value="interview">Technical Interview</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2">
        <DateField label="Date" value={selectedDate} />
      </div>
      <div className="flex flex-wrap gap-2">
        <TimeField label="Start Time" />
        <TimeField label="End Time" />
      </div>
      <RepeatBlock showMeetingsAndCost />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> You are busy on 21.08.2021, 21.08.2021,
          21.08.2021 betwen the time entered.
        </AlertDescription>
      </Alert>
      <p className="text-right text-sm">
        <a href="#" className="text-blue-600 underline">Click Here</a> To Skip Those Dates
      </p>
      <p className="font-semibold text-gray-800">Booking Information:</p>
      <SequenceCard />
      <CostSummary />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">Send To Student Inbox</Button>
      </div>
    </div>
  );
}

export default function AddNewBookingOrAvailabilityModal({ isOpen, onClose, selectedDate }) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Add New Booking Or Availability
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="avail" className="w-full">
          <TabsList className="bg-transparent p-0 h-auto gap-2 mb-3">
            <TabsTrigger
              value="avail"
              className="rounded-full px-4 py-1 border border-green-600 text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Open New Availability (T)
            </TabsTrigger>
            <TabsTrigger
              value="book"
              className="rounded-full px-4 py-1 border border-orange-500 text-orange-500 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              New Booking (T)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="avail">
            <OpenAvailabilityPane onClose={onClose} selectedDate={selectedDate} />
          </TabsContent>
          <TabsContent value="book">
            <NewBookingPane onClose={onClose} selectedDate={selectedDate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
