import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Bell,
  Mail,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';

const TIP =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function PillTrigger({ value, children }) {
  return (
    <TabsTrigger
      value={value}
      className="border border-gray-300 rounded-full px-3 py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600">
      {children}
    </TabsTrigger>
  );
}

function LabeledInput({ label, placeholder, type = 'text', tip = true }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
        {label}
        {tip && <InfoTip />}
      </label>
      <Input type={type} placeholder={placeholder} />
    </div>
  );
}

function DateField({ label }) {
  return (
    <div className="flex-1 min-w-[9rem]">
      <Label className="text-sm mb-1 block">{label}</Label>
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input type="date" className="pl-9" />
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

function DisclosureRow({ label, children }) {
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
          {label}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-gray-50 rounded-md p-3 text-sm text-gray-700 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function MiniMonthCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const leading = [31];
  const trailing = [1, 2, 3];
  return (
    <div className="bg-white rounded-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <button className="text-gray-500 hover:text-gray-700">‹</button>
        <div className="text-center">
          <div className="font-bold text-lg">August</div>
          <div className="text-xs text-gray-500">Wed Aug 03 2022</div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
        {DAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-sm gap-1">
        {leading.map((d) => (
          <div key={`l${d}`} className="text-gray-300">
            {d}
          </div>
        ))}
        {days.map((d) => (
          <div
            key={d}
            className={`py-1 rounded ${d === 3 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {d}
          </div>
        ))}
        {trailing.map((d) => (
          <div key={`t${d}`} className="text-gray-300">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function DaysOfWeekCheckboxes() {
  const [checked, setChecked] = useState(() => new Set(DAYS));
  const toggle = (d) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  return (
    <>
      <p className="text-sm">Which days of the week do you want to apply changes to?</p>
      <div className="flex flex-wrap gap-3 mt-3">
        {DAYS.map((d) => (
          <label key={d} className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox checked={checked.has(d)} onCheckedChange={() => toggle(d)} />
            {d}
          </label>
        ))}
      </div>
    </>
  );
}

function NotificationRow({ icon: Icon, options, showRotate }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-600" />
      <Select defaultValue={options[0]}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showRotate && (
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SequenceCard({ index, showDeleted }) {
  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-700">Sequence {index}:</p>
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
        <p>
          Su, Mo, <span className="opacity-50">Tu</span>, We, Th,{' '}
          <span className="opacity-50">Fr</span>, Sa
        </p>
        <p>3rd July 2021 - 10th Oct. 2021</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>10:00 - 12:00</span>
        <span className="inline-flex items-center gap-1">
          <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-semibold">
            1
          </span>
          Hr.
        </span>
        <span className="font-semibold">150$</span>
      </div>
      <div className="text-sm">
        <p className="font-semibold text-gray-700">Not incuded</p>
        <p className="text-gray-600">3,4,5 July 21</p>
        <p className="text-gray-600">10,13,15 Sep 21</p>
      </div>
      {showDeleted && (
        <div className="bg-red-50 text-red-700 rounded-md p-2 text-sm">
          Sequence {index} deleted!{' '}
          <a href="#" className="text-blue-600 underline">
            Undo
          </a>
        </div>
      )}
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
        <span className="font-semibold text-gray-700 flex items-center">
          Calculation
          <InfoTip />:
        </span>
        <span>9Hrs. = 300$</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 flex items-center">
          Added Taxes (18%)
          <InfoTip />:
        </span>
        <span>20$</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 flex items-center">
          Cancellation Fees (30%)
          <InfoTip />:
        </span>
        <span>20$</span>
      </div>
      <p className="text-xs text-gray-500">
        (Free Cancellation before 23:59 on 10 Dec. 2021)
      </p>
      <div className="flex justify-between pt-2 border-t">
        <span className="font-semibold text-gray-700">Total Cost:</span>
        <span>
          <span className="text-blue-600 font-semibold">300$</span>{' '}
          <span className="text-gray-500 text-xs">USD</span>
        </span>
      </div>
    </div>
  );
}

function BookingForm({ finalCta }) {
  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-800 underline">
        {finalCta.subject === 'teacher' ? 'Book This Teacher' : 'Book This Student'}
      </p>
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
        <DateField label="Start Date" />
        <DateField label="End Date" />
      </div>

      <DisclosureRow label="View Monthly Calander">
        <MiniMonthCalendar />
      </DisclosureRow>

      <DisclosureRow
        label={
          <span className="inline-flex items-center">
            Advanced date selection
            <InfoTip />
          </span>
        }>
        <DaysOfWeekCheckboxes />
      </DisclosureRow>

      <p className="text-sm font-medium text-gray-700 flex items-center">
        Time Of Booking
        <InfoTip />
      </p>
      <div className="flex flex-wrap gap-2">
        <TimeField label="Start Time" />
        <TimeField label="End Time" />
      </div>

      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> Teacher is not available on 21.08.2021,
          21.08.2021, 21.08.2021 betwen the time entered.
        </AlertDescription>
      </Alert>
      <p className="text-right text-sm">
        <a href="#" className="text-blue-600 underline">
          Click Here
        </a>{' '}
        To Skip Those Dates
      </p>

      <p className="text-sm">
        <span className="font-semibold">Price per Hour:</span> 10$
      </p>

      <DisclosureRow
        label={
          <span className="inline-flex items-center">
            Repeat Sequence
            <InfoTip />
          </span>
        }>
        <p><span className="font-semibold">Starting Date:</span> 3rd July 2021</p>
        <p><span className="font-semibold">Days Of The Week:</span> Mon, Wed, Sat</p>
        <p>
          <span className="font-semibold">Repeat For:</span>{' '}
          <span className="border-b border-dashed border-gray-400">12</span> Weeks
        </p>
        <p><span className="font-semibold">Last Date:</span> 10th Oct. 2021</p>
        <p><span className="font-semibold">No. Of Hours:</span> 15</p>
        <p><span className="font-semibold">No. Of Meetings:</span> 3</p>
        <p><span className="font-semibold">No. Of Days:</span> 5</p>
        <p><span className="font-semibold">Total Sequence Cost:</span> 10$ * 15hr. = 150$</p>
      </DisclosureRow>

      <p className="text-sm">
        <span className="font-semibold">No. Of Hours:</span> 15
      </p>
      <p className="text-sm">
        <span className="font-semibold">Total Sequence Cost:</span> 10$ * 15hr. = 150$
      </p>

      <DisclosureRow label="Your Notification">
        <NotificationRow
          icon={Bell}
          options={['No Notification', '2 hours before', '3 hours before', '4 hours before']}
          showRotate
        />
        <NotificationRow
          icon={Mail}
          options={['No Notification', '1 day before', '2 day before', '3 day before']}
        />
      </DisclosureRow>

      <div className="flex gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">Save Sequence</Button>
      </div>

      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> time wasn't selected.
        </AlertDescription>
      </Alert>

      <a href="#" className="text-blue-600 text-sm">
        + Add additional Sequence
      </a>

      <p className="font-semibold text-gray-800 underline">
        Continue With This Sequence To Payment
      </p>

      <SequenceCard index={1} showDeleted />
      <SequenceCard index={2} />
      <CostSummary />

      {finalCta.extraText && (
        <p className="text-sm text-gray-600">{finalCta.extraText}</p>
      )}
      <div className="flex gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">{finalCta.label}</Button>
      </div>
    </div>
  );
}

function SelectedChip({ letter = 'P', line1 = 'Prateek K - 9902', line2 = 'Engineering Entrance Coaching' }) {
  return (
    <div className="flex items-start gap-2">
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-semibold">
        {letter}
      </span>
      <div className="text-sm">
        <p>{line1}</p>
        <p>{line2}</p>
      </div>
    </div>
  );
}

function MoreSearchOptions({ label = 'Teacher Unique Number' }) {
  return (
    <DisclosureRow label="More Search Options">
      <Label className="text-sm">{label}</Label>
      <Input placeholder="12- Shay B" />
    </DisclosureRow>
  );
}

function OtherTeacherPane() {
  return (
    <div className="space-y-4 pt-2">
      <LabeledInput label="Search Teacher By Name" placeholder="Search a teacher" type="search" />
      <LabeledInput label="Enter Teacher Profile Link" placeholder="Paste url here" />
      <MoreSearchOptions label="Teacher Unique Number" />
      <SelectedChip />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> can choose only one teacher.
        </AlertDescription>
      </Alert>
      <BookingForm finalCta={{ subject: 'teacher', label: 'Continue To Payment' }} />
    </div>
  );
}

function KnownStudentPane() {
  return (
    <div className="space-y-4 pt-2">
      <LabeledInput label="Search Student By Name" placeholder="Enter Student Name" type="search" />
      <LabeledInput label="Student Email" placeholder="Enter Student Email" type="email" />
      <MoreSearchOptions label="Student Unique Number" />
      <SelectedChip />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> can choose only one student.
        </AlertDescription>
      </Alert>
      <BookingForm finalCta={{ subject: 'student', label: 'Send To Student Inbox' }} />
    </div>
  );
}

function NewStudentPane() {
  return (
    <div className="space-y-4 pt-2">
      <LabeledInput label="Student Name" placeholder="Enter Student Name" />
      <LabeledInput label="Student Email" placeholder="Enter Student Email" type="email" />
      <LabeledInput label="Student Phone Number" placeholder="Enter Student Phone No." />
      <Button className="bg-green-600 hover:bg-green-700">Save To Contact List</Button>
      <SelectedChip />
      <Alert variant="destructive" className="text-sm">
        <AlertDescription>
          <strong>Warning!</strong> can choose only one student.
        </AlertDescription>
      </Alert>
      <BookingForm
        finalCta={{
          subject: 'student',
          label: 'Send To E-mail',
          extraText: 'Send payment & registration to student personal e-mail',
        }}
      />
    </div>
  );
}

function ForAStudentPane() {
  return (
    <Tabs defaultValue="known" className="w-full pt-2">
      <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
        <PillTrigger value="known">Known Student</PillTrigger>
        <PillTrigger value="new">New Student</PillTrigger>
      </TabsList>
      <TabsContent value="known">
        <KnownStudentPane />
      </TabsContent>
      <TabsContent value="new">
        <NewStudentPane />
      </TabsContent>
    </Tabs>
  );
}

export default function CalendarNewBookingPanel() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h4 className="text-lg font-bold text-gray-800">New Booking</h4>
      <Tabs defaultValue="other" className="w-full">
        <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
          <PillTrigger value="other">Other Teacher</PillTrigger>
          <PillTrigger value="student">For A Student</PillTrigger>
        </TabsList>
        <TabsContent value="other">
          <OtherTeacherPane />
        </TabsContent>
        <TabsContent value="student">
          <ForAStudentPane />
        </TabsContent>
      </Tabs>
    </div>
  );
}
