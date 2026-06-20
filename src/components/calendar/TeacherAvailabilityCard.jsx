
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
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import NavigationWithinLegend from './NavigationWithinLegend';
import CalendarWithinCalendarCards from './CalendarWithinCalendarCards';
import DateRangePicker from '../common/DateRangePicker';
import TimeRangeFields from '../common/TimeRangeFields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Availability } from '@/api/entities'; // New import
import { timeFloorForDate, isFutureDateTime } from '@/lib/calendar/futureTime';
import { computeBookableWindow, parseTimeRange, formatRemaining } from '@/lib/calendar/bookableWindow';

export default function TeacherAvailabilityCard({ event, onClose, onDateChange, onAvailabilityChanged, savedAvailabilitySlots = [], syncedDayEvents = [], showEditIcon = true }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  // Auto-focus-next-input now lives INSIDE <TimeRangeFields/>; the
  // shared component owns the End-picker ref internally so this
  // popup no longer needs its own `endTimeRef`.

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

  // Internal conflicts — overlapping availability slots the teacher
  // already saved on the same date.
  const internalConflicts = useMemo(() => {
    if (!changeAvailYMD || !startTime || !endTime) return [];
    return (savedAvailabilitySlots || []).filter(
      (s) => s && s.date === changeAvailYMD && timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
  }, [savedAvailabilitySlots, changeAvailYMD, startTime, endTime]);

  // Same-role vs cross-role split (new soft-conflict rule). Saved slots
  // in this store carry no explicit `role` field — they're all role 'T'
  // by construction (synthesized as such in TeacherCalendar). So when
  // the active card is also 'T', every overlap is a same-role conflict
  // and downgrades to YELLOW (soft, non-blocking). If a future store
  // ever includes role-'S' rows, those would land in the cross-role
  // bucket and trigger the existing RED (hard, blocking) behavior.
  const currentRole = event?.role || 'T';
  const internalSameRoleConflicts = useMemo(
    () => internalConflicts.filter((s) => (s.role || 'T') === currentRole),
    [internalConflicts, currentRole]
  );
  const internalCrossRoleConflicts = useMemo(
    () => internalConflicts.filter((s) => (s.role || 'T') !== currentRole),
    [internalConflicts, currentRole]
  );
  const hasInternalSoftConflict = internalSameRoleConflicts.length > 0;

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
  // Availability is a present/future event: the new start (date + time) must be
  // strictly in the future. The date picker already blocks past days; this also
  // catches a today-but-past time. Hard-blocks the save.
  const pastStart = !!changeAvailDate && !!startTime && !isFutureDateTime(changeAvailDate, startTime);
  // Only cross-role internal overlaps trigger the RED hard-block now.
  // Same-role overlaps are soft (yellow) and the teacher can still save.
  const hasHardConflict = internalCrossRoleConflicts.length > 0;
  // Button is "active green" when all fields are filled AND there is no
  // hard cross-role internal conflict AND the start is in the future. Same-role
  // internal conflicts and synced (external) conflicts are soft and do NOT block.
  const isSubmitActive = isFormComplete && !hasHardConflict && !pastStart;

  // Real save (Change Availability) + real delete state. Success feedback
  // now goes through the centered 10-second toast (Task 1) — the popup
  // closes on success so the previous in-popup 30s success line had
  // nothing to attach to and is removed.
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Header title pulled from the same string the card's <h3> renders, so the
  // delete-confirmation Description reads "remove your My Availability (T)"
  // rather than a hand-rolled generic label.
  const headerTitle = `My Availability${event?.role ? ` (${event.role})` : ''}`;

  // Wired to <AlertDialogAction>'s onClick. Calls the existing base44
  // Availability entity service (no new save logic invented). If event.id
  // is missing or the row doesn't exist, .delete returns null without
  // throwing — we surface a toast either way and let the modal close.
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (event?.id) {
        await Availability.delete(event.id);
      }
      // Tasks 2 — surface the change to the parent grid so its
      // `savedAvailabilitySlots` state drops this slot reactively. The
      // grid renders chips off that store; without this hop the chip
      // would stay visible until a full reload.
      if (typeof onAvailabilityChanged === 'function') {
        onAvailabilityChanged({ type: 'delete', event });
      }
      toast({ title: 'Event successfully removed.' });
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      toast({
        title: 'Could not remove this event.',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Task 4 — click handler. CRUCIALLY does not rely on the `disabled`
  // attribute (the button stays clickable so it can surface the error).
  // Now wired to the real Availability.update endpoint plus the 30-second
  // success-line UX shared with the sidebar.
  const handleChangeAvailability = async () => {
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
    if (pastStart) {
      // The red future-time alert is already visible; block the save.
      setValidationErrors([]);
      return;
    }
    setValidationErrors([]);
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (event?.id) {
        await Availability.update(event.id, {
          start_time: startTime,
          end_time: endTime,
        });
      }
      // Task 3 — surface the new (date, start, end) to the parent grid
      // so the chip moves to its new day/time without a hard refresh.
      // The parent removes the old slot identified by event.dateString +
      // event.time and inserts a fresh one for the new tuple.
      if (typeof onAvailabilityChanged === 'function') {
        onAvailabilityChanged({
          type: 'update',
          event,
          nextDate: changeAvailDate,
          nextStartTime: startTime,
          nextEndTime: endTime,
        });
      }
      // Centered 5-second success toast (default duration). The popup
      // closes immediately after so the teacher's focus moves back to
      // the calendar — matches the "close popup + toast" pattern.
      toast({
        title: 'Availability successfully updated.',
        description: `${headerTitle} on ${format(changeAvailDate, 'dd.MM.yyyy')} between ${startTime} and ${endTime}.`,
      });
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      toast({
        title: 'Could not update availability.',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Task 1 — Dynamic error clearing. Re-evaluate validationErrors any
  // time the user changes Date / Start Time / End Time so the red
  // "Please fill in the following required field(s)" banner shrinks
  // (and eventually disappears) live, instead of freezing until the
  // next gray-button click.
  //
  // Important: this NEVER promotes a clean state to an error. It only
  // narrows / clears the existing error set. Initial validation still
  // happens exclusively in handleChangeAvailability on save-click.
  //
  // Performance note: the hard/soft conflict checks are already pure
  // useMemo over the in-memory savedAvailabilitySlots store — there
  // is no backend call on each keystroke, so no debounce is required.
  // If a future revision routes overlap-checking through the backend,
  // wrap the new check in a 300ms debounce per the spec.
  useEffect(() => {
    if (validationErrors.length === 0) return;
    const next = [];
    if (!changeAvailDate) next.push('Select Date');
    if (!startTime) next.push('Start Time');
    if (!endTime) next.push('End Time');
    // Only call setState when the set actually changed — avoids a
    // re-render loop because this effect's deps include the inputs that
    // the banner reflects.
    const sameLength = next.length === validationErrors.length;
    const sameContents = sameLength && next.every((m, i) => m === validationErrors[i]);
    if (!sameContents) setValidationErrors(next);
  }, [changeAvailDate, startTime, endTime, validationErrors]);

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

  // Live bookable window for THIS slot (Q2 — the front edge rolls forward with
  // the clock while the END stays pinned). The teacher keeps seeing their
  // committed range; the elapsed part is greyed and the rolled "bookable from"
  // is annotated. noticeMinutes defaults to 0 (the platform default — advance
  // booking now defaults to no notice); thread the teacher's real notice here
  // if/when their settings flow into this card.
  const slotRange = parseTimeRange(event.time || '');
  const win = slotRange
    ? computeBookableWindow({
        date: event.dateString || selectedDate,
        startTime: slotRange.startTime,
        endTime: slotRange.endTime,
      })
    : null;

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

      {/* Task 2 — Pencil edit icon is hidden when `showEditIcon` is false (the
          AvailabilityModal passes false for the My-Availability-(T) view). The
          icon stays available on any other call site, default `true`. */}
      {/* Task 3 — Trash2 click is intercepted by a Radix AlertDialog. The
          underlying delete function will be wired in `<AlertDialogAction>`
          when it exists; right now the action just closes the alert so no
          save/data flow is altered. Dynamic Date/Start/End come from the
          selected event's `dateString` and `time`. */}
      <div className="flex justify-end items-center border-b pb-2">
        {showEditIcon && (
          <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Availability Slot?</AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const evDate = event?.dateString
                    ? format(new Date(event.dateString), 'dd.MM.yyyy')
                    : '—';
                  const [evStart = '—', evEnd = '—'] = (event?.time || '').split(' - ');
                  return (
                    <>
                      Are you sure you want to remove your <strong>{headerTitle}</strong> on{' '}
                      <strong>{evDate}</strong> between <strong>{evStart}</strong> and{' '}
                      <strong>{evEnd}</strong>? This action cannot be undone.
                    </>
                  );
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </span>
                ) : (
                  'Remove'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        {win && win.valid ? (
          <>
            <p className="text-sm text-gray-600">
              {format(selectedDate, 'dd.MM.yyyy')} |{' '}
              {win.state === 'ended' ? (
                <span className="text-gray-400 line-through">{win.originalStart} – {win.originalEnd}</span>
              ) : win.isPartlyElapsed ? (
                <>
                  {/* The elapsed hours are greyed/struck; the live remainder stays normal. */}
                  <span className="text-gray-400 line-through">{win.originalStart}</span>
                  <span> – {win.originalEnd}</span>
                </>
              ) : (
                <span>{win.originalStart} – {win.originalEnd}</span>
              )}
            </p>
            {win.state === 'live' && (
              <p className="text-xs text-green-700">
                Bookable from {win.effectiveStart} · {formatRemaining(win.remainingMinutes)} left
              </p>
            )}
            {win.state === 'ended' && (
              <p className="text-xs text-gray-400">This availability has already ended.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-600">{format(selectedDate, 'dd.MM.yyyy')} | {event.time || activeTimeSlot}</p>
        )}
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
              singlePlaceholder="Select date"
              // Task 1 — red border when the user clicked the gray
              // "Change Availability" button with Date missing. The
              // validationErrors array is the popup's existing source
              // of truth for "what did the user forget"; we just
              // surface that state on the field itself instead of
              // only in the banner below.
              invalid={validationErrors.includes('Select Date')}
            />
          </div>
          {/* Task 1 — Start Time / End Time now use the shared <TimeSelect>
              extracted from CalendarSidebar (Radix-Popover-based HH:MM picker).
              Identical Tailwind classes and dropdown logic as the sidebar's
              "Set Availability (T)" tab; the popover registers as a branch of
              the parent Dialog so its menu is recognized as "inside" the modal
              and never dismisses it. minTime on End wires the same strict
              "must be after Start" filter used in the sidebar.
              triggerClassName="h-10 px-3" makes the Time triggers match the
              DateRangePicker's h-10 px-3 trigger exactly (Task 3 alignment). */}
          {/* Task 1 — Start/End Time now mount the shared
              <TimeRangeFields/> component (the same one used by the
              sidebar's Set Availability tab). Bidirectional filter,
              auto-focus-next, and per-field invalid markers all come
              along for free.
              triggerClassName="h-10 px-3 bg-transparent" overrides
              TimeSelect's default contrasting `bg-gray-50` so the
              input blends with the popup card's surface (placeholder
              copy locked to "Select time" per the Task 1 spec). */}
          <div className="col-span-2 md:col-span-2 grid grid-cols-2 gap-2">
            <TimeRangeFields
              startTime={startTime}
              endTime={endTime}
              onChange={({ startTime: s, endTime: e }) => {
                setStartTime(s);
                setEndTime(e);
              }}
              startInvalid={validationErrors.includes('Start Time') || pastStart}
              endInvalid={
                !!(startTime && endTime && endTime <= startTime) ||
                validationErrors.includes('End Time')
              }
              minTime={timeFloorForDate(changeAvailDate)}
              triggerClassName="h-10 px-3 bg-transparent"
              placeholder="Select time"
            />
          </div>
        </div>
      </div>
      
      {/* Cross-role hard conflict (RED). Submit gets the gray/inactive
          state below. Same-role overlaps are downgraded to soft yellow
          (rendered immediately under this block). */}
      {hasHardConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflict with an existing availability</AlertTitle>
          <AlertDescription className="text-xs">
            The time you entered overlaps with another availability you've already saved on this date. Please pick a different time before submitting.
          </AlertDescription>
        </Alert>
      )}
      {pastStart && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Time must be in the future</AlertTitle>
          <AlertDescription className="text-xs">
            Availability can only be set for an upcoming date and time. Please pick a time later than now.
          </AlertDescription>
        </Alert>
      )}
      {/* Task 1 — Same-role internal overlap (YELLOW, soft). Submit
          stays ACTIVE/green so the teacher can intentionally save an
          overlap with their own existing slot — the parent's
          handleAvailabilityChanged then merges the new slot via
          applySaveAvailability's v6 fold. */}
      {hasInternalSoftConflict && (
        <Alert className="bg-yellow-50 border border-yellow-200 text-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertTitle>Overlaps with another {headerTitle} slot</AlertTitle>
          <AlertDescription className="text-xs">
            This time overlaps with another availability of the same role on this date. You can still save it and it will be merged with the existing slot.
          </AlertDescription>
        </Alert>
      )}
      {/* External synced-calendar overlap (YELLOW, soft). Button stays
          ACTIVE/green so the teacher can override the synced event. */}
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
            can surface the validation error / hard-conflict messaging. While
            isSaving, swap text for a Loader2 spinner to prevent double-clicks
            (the handler itself also early-returns when isSaving is true). */}
        <Button
          onClick={handleChangeAvailability}
          aria-disabled={!isSubmitActive || isSaving}
          aria-busy={isSaving}
          className={`w-full ${
            isSubmitActive
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-default hover:bg-gray-300'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Change Availability'
          )}
        </Button>
      </div>
    </div>
  );
}
