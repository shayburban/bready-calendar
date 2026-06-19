import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// Same Start-Date field + Start/End-Time fields the "My Availability (T)" popup
// card uses, so the date/time pickers are identical across surfaces.
import DateRangePicker from '../common/DateRangePicker';
import TimeRangeFields from '../common/TimeRangeFields';
import { expandRepeatDates } from '@/lib/calendar/repeatDates';
import { timeFloorForDate } from '@/lib/calendar/futureTime';
import { syncedOverlapsForSlots } from '@/lib/calendarSyncedOverlap';
// The "New Booking" tab IS the shared NewBookingForm — the SAME component the
// calendar sidebar's "New Booking" panel renders, so both have identical logic.
// RepeatControl is shared from there too (used by the availability pane below).
import NewBookingForm, { RepeatControl } from './NewBookingForm';

const toMinutes = (t) => {
  if (!t || typeof t !== 'string') return null;
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
// Availability is a present/future event: the chosen start (date + start time,
// in the viewer's local zone) must be strictly after now. The date picker blocks
// past DAYS; this also catches a today-but-past TIME. The repeat start date is
// always the earliest occurrence, so checking it covers every later one too.
const startIsFuture = (dateObj, startHHMM) => {
  if (!dateObj || !startHHMM) return false;
  const [h, m] = startHHMM.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const dt = new Date(dateObj);
  dt.setHours(h, m, 0, 0);
  return dt.getTime() > Date.now();
};
const fmtDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Open Availability (T) — same rules as the sidebar's Set Availability ──────
function OpenAvailabilityPane({ onClose, selectedDate, onSaveAvailability, syncedEvents }) {
  const [date, setDate] = useState(selectedDate ? new Date(selectedDate) : null);
  const [time, setTime] = useState({ startTime: '', endTime: '' });
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [weekdays, setWeekdays] = useState(() =>
    selectedDate ? [new Date(selectedDate).getDay()] : []
  );
  const [weeks, setWeeks] = useState(14); // platform default availability window
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleWeekday = (i) =>
    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));

  const dates = useMemo(
    () =>
      expandRepeatDates({
        startDate: date,
        weekdays: repeatOpen ? weekdays : [],
        repeatWeeks: repeatOpen ? weeks : 0,
      }),
    [date, repeatOpen, weekdays, weeks]
  );

  const durMin = (toMinutes(time.endTime) ?? 0) - (toMinutes(time.startTime) ?? 0);
  const timeValid = !!time.startTime && !!time.endTime && durMin > 0;
  // Start must be in the future (catches today + a past time).
  const startFuture = startIsFuture(date, time.startTime);
  const pastStart = !!date && !!time.startTime && timeValid && !startFuture;
  const formValid = !!date && timeValid && startFuture;

  // Slots in the SAME shape the sidebar emits → reuses the exact downstream
  // path (merge, localStorage, debounced instant-booking publish).
  const slots = useMemo(
    () => (formValid ? dates.map((d) => ({ date: d, startTime: time.startTime, endTime: time.endTime })) : []),
    [formValid, dates, time]
  );

  // Same synced-overlap warning the sidebar shows (non-blocking).
  const overlaps = useMemo(
    () => (slots.length ? syncedOverlapsForSlots(slots, syncedEvents || []) : []),
    [slots, syncedEvents]
  );

  const handleSave = () => {
    if (!formValid) { setShowErrors(true); return; }
    if (saving) return;
    setSaving(true);
    try {
      onSaveAvailability?.(slots, 'open');
      toast({
        title: 'Availability schedule successfully saved.',
        description: overlaps.length
          ? '⚠ Note: This availability overlaps with a synced calendar event.'
          : `${slots.length} slot${slots.length > 1 ? 's' : ''} opened for booking.`,
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const totalHours = round2(dates.length * (durMin > 0 ? durMin / 60 : 0));

  return (
    <div className="space-y-4">
      <DateRangePicker
        singleDate
        singleValue={date}
        onSingleChange={setDate}
        singleLabel="Date"
        singlePlaceholder="Select date"
        invalid={showErrors && !date}
      />
      <div className="grid grid-cols-2 gap-2">
        <TimeRangeFields
          startTime={time.startTime}
          endTime={time.endTime}
          onChange={setTime}
          startInvalid={(showErrors && !time.startTime) || (showErrors && pastStart)}
          endInvalid={(!!time.startTime && !!time.endTime && durMin <= 0) || (showErrors && !time.endTime)}
          minTime={timeFloorForDate(date)}
          triggerClassName="h-10 px-3"
          placeholder="Select time"
        />
      </div>

      <RepeatControl
        open={repeatOpen}
        setOpen={setRepeatOpen}
        weekdays={weekdays}
        toggleWeekday={toggleWeekday}
        weeks={weeks}
        setWeeks={setWeeks}
        summary={
          <div className="space-y-1">
            <p><span className="font-semibold text-gray-700">First Date:</span> {fmtDate(dates[0])}</p>
            <p><span className="font-semibold text-gray-700">Last Date:</span> {fmtDate(dates[dates.length - 1])}</p>
            <p><span className="font-semibold text-gray-700">No. of Days:</span> {dates.length}</p>
            <p><span className="font-semibold text-gray-700">No. of Hours:</span> {totalHours}</p>
          </div>
        }
      />

      {overlaps.length > 0 && (
        <Alert className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
          <AlertDescription>
            <strong>Warning:</strong> This selection overlaps with a synced calendar event
            {overlaps[0]?.range ? ` (${overlaps[0].range})` : ''}. You can still save it.
          </AlertDescription>
        </Alert>
      )}

      {formValid && (
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-800">Changes will be made to the following dates &amp; hours:</p>
          <p>{dates.length === 1 ? fmtDate(dates[0]) : `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])} (${dates.length} days)`}</p>
          <p>{time.startTime} – {time.endTime}</p>
        </div>
      )}

      {showErrors && !formValid && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {pastStart
            ? 'The start time must be in the future — availability can only be opened for upcoming times.'
            : 'Please pick a date and a valid start/end time before saving.'}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          aria-disabled={!formValid || saving}
          className={formValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 hover:bg-gray-300'}
        >
          {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span> : 'Open Availability'}
        </Button>
      </div>
    </div>
  );
}

export default function AddNewBookingOrAvailabilityModal({
  isOpen,
  onClose,
  selectedDate,
  onSaveAvailability,
  onBookingCreated,
  syncedEvents = [],
}) {
  // Remount the panes whenever the modal (re)opens on a date, so all fields
  // reset and re-seed from `selectedDate` cleanly.
  const seedKey = `${isOpen ? 'open' : 'closed'}-${selectedDate || ''}`;
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Booking Or Availability</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="avail" className="w-full" key={seedKey}>
          <TabsList className="bg-transparent p-0 h-auto gap-2 mb-3">
            <TabsTrigger
              value="avail"
              className="rounded-full px-4 py-1 border border-green-600 text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              Open New Availability (T)
            </TabsTrigger>
            <TabsTrigger
              value="book"
              className="rounded-full px-4 py-1 border border-orange-500 text-orange-500 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              New Booking
            </TabsTrigger>
          </TabsList>
          <TabsContent value="avail">
            <OpenAvailabilityPane
              onClose={onClose}
              selectedDate={selectedDate}
              onSaveAvailability={onSaveAvailability}
              syncedEvents={syncedEvents}
            />
          </TabsContent>
          <TabsContent value="book">
            {/* Shared form — identical logic to the sidebar's New Booking panel. */}
            <NewBookingForm onClose={onClose} selectedDate={selectedDate} onBookingCreated={onBookingCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
