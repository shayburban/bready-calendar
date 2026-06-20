
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import NavigationWithinLegend from './NavigationWithinLegend';
import { categoryDatesForPicker, eventsForDate } from '@/lib/calendar/categoryDates';
import TeacherAvailabilityCard from './TeacherAvailabilityCard';
import GlobalBookingCard from './GlobalBookingCard';
import BookedAsStudentCard from './BookedAsStudentCard';
import BookedAsStudentRescheduleCard from './BookedAsStudentRescheduleCard';
import BookedAsTeacherRescheduleCard from './BookedAsTeacherRescheduleCard';
import CancellationFeesCard from './CancellationFeesCard';
import CancellationFeesTeacherCard from './CancellationFeesTeacherCard';
import NotReviewedTeacherCard from './NotReviewedTeacherCard';
import NotReviewedStudentCard from './NotReviewedStudentCard';
import TeacherAvailabilityStudentCard from './TeacherAvailabilityStudentCard';
import WaitingForConfirmationTeacherCard from './WaitingForConfirmationTeacherCard';
import WaitingForConfirmationTeacherRescheduleCard from './WaitingForConfirmationTeacherRescheduleCard';
import WaitingForConfirmationStudentCard from './WaitingForConfirmationStudentCard';
import WaitingForConfirmationStudentRescheduleCard from './WaitingForConfirmationStudentRescheduleCard';
import CompletedTeacherCard from './CompletedTeacherCard';
import CompletedStudentCard from './CompletedStudentCard';

const startMinutesOf = (e) => {
  if (typeof e.startHour === 'number') return e.startHour * 60;
  const m = (e.time || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
};

export default function AvailabilityModal({ event, isOpen, onClose, savedAvailabilitySlots = [], events = [], onAvailabilityChanged, onRequestResponded }) {
  // Contextual date set for the in-card dropdown (spec #1 + #2): the dates that
  // HAVE an event of THIS card's type+role. Availability (role 'T') is backed by
  // the teacher's real saved slots; every other type by the master calendar
  // events. CalendarWithinCalendarCards enables exactly these and disables the
  // rest. Keyed off the clicked event's type/role so it stays stable across
  // sibling chips on the same day.
  const availableDates = useMemo(() => {
    if (!event) return [];
    return categoryDatesForPicker({
      events,
      savedSlots: savedAvailabilitySlots,
      type: event.type,
      role: event.role,
      center: event.dateString ? new Date(event.dateString) : new Date(),
    });
  }, [event, events, savedAvailabilitySlots]);

  // The modal owns the "active date" so chips, "Your Availability" text,
  // and the picker can stay in sync as the user picks a new date. Initialized
  // from the clicked event's dateString and resynced if the event itself
  // changes (i.e. a new popup is opened on a different day).
  const [activeDate, setActiveDate] = useState(event?.dateString || '');
  useEffect(() => {
    if (event?.dateString) setActiveDate(event.dateString);
  }, [event?.dateString]);

  // Combined slot list. When the user is still on the originally-clicked day
  // (`activeDate === event.dateString`), use the existing siblingEvents-based
  // list so all prior chip behavior is preserved bit-for-bit. When the user
  // has navigated to a different date via the picker, derive slots from
  // savedAvailabilitySlots for that day so the chips and dateString match
  // the newly selected day (Bug 2 fix). Time string is the slot identity.
  const allSlots = useMemo(() => {
    if (!event) return [];
    // CRITICAL: useState only initializes once on mount, so on the very first
    // render after a fresh `event` arrives, `activeDate` is still the stale
    // empty string from the time `event` was null. Treat an empty/missing
    // activeDate as the original-date case so we don't try to parse '' and
    // throw — the sync useEffect will set activeDate to event.dateString on
    // the next tick, and from then on the comparison works normally.
    const isOriginalDate = !activeDate || activeDate === event.dateString;
    if (isOriginalDate) {
      const siblings = (event.siblingEvents || [])
        .filter((s) => s?.time && s.time !== event.time)
        .slice()
        .sort((a, b) => startMinutesOf(a) - startMinutesOf(b));
      const seen = new Set([event.time]);
      const dedupSiblings = [];
      siblings.forEach((s) => {
        if (seen.has(s.time)) return;
        seen.add(s.time);
        dedupSiblings.push(s);
      });
      return [event, ...dedupSiblings];
    }
    // Different date picked via the picker — the matching events of THIS card's
    // type+role on that date (availability synthesized from saved slots; every
    // other type from the master events). Falls back to [event] if nothing
    // matches so the modal never renders an empty card.
    const matched = eventsForDate({
      events,
      savedSlots: savedAvailabilitySlots,
      type: event.type,
      role: event.role,
      dateISO: activeDate,
    });
    return matched.length > 0 ? matched : [event];
  }, [event, activeDate, savedAvailabilitySlots, events]);

  const [selectedTime, setSelectedTime] = useState(event?.time || '');

  useEffect(() => {
    if (event?.time) setSelectedTime(event.time);
  }, [event]);

  // Picker → date change handler. Updates activeDate AND snaps the active
  // chip to the first slot of the newly selected day so the modal content
  // (chips, "Your Availability" text, form details) follows (Bug 2 fix).
  // Picker → date change handler (spec #3). Updates the active date AND snaps the
  // active chip to the first matching event of that day so the WHOLE card
  // re-hydrates (chips, date text, details) WITHOUT closing. Generic over the
  // card's type+role.
  const handleDateChange = (newDateISO) => {
    if (!newDateISO || !event) return;
    setActiveDate(newDateISO);
    const matched = eventsForDate({
      events,
      savedSlots: savedAvailabilitySlots,
      type: event.type,
      role: event.role,
      dateISO: newDateISO,
    });
    setSelectedTime(matched.length > 0 ? matched[0].time : '');
  };

  if (!event) return null;

  const baseActive = allSlots.find((s) => s.time === selectedTime) || allSlots[0] || event;
  // Controlled chip row injected into each card at its native "below-date,
  // above-actions" slot. Only renders when there's more than one same-day
  // sibling for this type+role; otherwise it's null and cards fall through.
  const slotHeader =
    allSlots.length > 1 ? (
      <div className="px-1 pb-1">
        <NavigationWithinLegend
          timeSlots={allSlots.map((s) => s.time)}
          activeSlot={selectedTime}
          onSlotSelect={setSelectedTime}
          maxVisible={3}
        />
      </div>
    ) : null;
  // Override dateString to the active date so the card's date-driven UI
  // follows; set availableDatesForCategory to the per-type date set so the
  // in-card dropdown enables only the days that have a matching-type event
  // (stable across sibling chips).
  const activeEvent = {
    ...baseActive,
    // Fall back to event.dateString so the very first render — when activeDate
    // hasn't been hydrated yet by the sync effect — emits a coherent dateString
    // instead of an empty string that the card's downstream effect would skip.
    dateString: activeDate || event.dateString,
    slotHeader,
    availableDatesForCategory: availableDates,
  };

  // Every card receives onDateChange={handleDateChange} so its in-card date
  // dropdown can re-hydrate the whole card for a newly picked date (spec #3).
  const renderCard = () => {
    switch (activeEvent.type) {
      case 'availability':
        if (activeEvent.role === 'S') return <TeacherAvailabilityStudentCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} savedAvailabilitySlots={savedAvailabilitySlots} onAvailabilityChanged={onAvailabilityChanged} showEditIcon={false} />;
      case 'booked':
        if (activeEvent.role === 'S') {
          if (activeEvent.reschedule) return <BookedAsStudentRescheduleCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
          return <BookedAsStudentCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        }
        if (activeEvent.role === 'T' && activeEvent.reschedule) {
          return <BookedAsTeacherRescheduleCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        }
        return <GlobalBookingCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      case 'cancelled':
        if (activeEvent.role === 'T') return <CancellationFeesTeacherCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        return <CancellationFeesCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      case 'waiting':
        if (activeEvent.role === 'T') {
          if (activeEvent.reschedule) return <WaitingForConfirmationTeacherRescheduleCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} onResponded={onRequestResponded} />;
          return <WaitingForConfirmationTeacherCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} onResponded={onRequestResponded} />;
        }
        if (activeEvent.role === 'S') {
          if (activeEvent.reschedule) return <WaitingForConfirmationStudentRescheduleCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
          return <WaitingForConfirmationStudentCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        }
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      case 'not-reviewed':
        if (activeEvent.role === 'T') return <NotReviewedTeacherCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        if (activeEvent.role === 'S') return <NotReviewedStudentCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      case 'completed':
        if (activeEvent.role === 'T') return <CompletedTeacherCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        if (activeEvent.role === 'S') return <CompletedStudentCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      default:
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
    }
  };

  // No outside-event guarding needed any more: the DateRangePicker's
  // single-date calendar is now a Radix Popover, whose PopoverContent
  // registers itself as a DismissableLayer BRANCH of this Dialog via
  // React context (which propagates through portals). Radix treats clicks
  // on a branch as inside the parent layer, so date-cell and month-nav
  // clicks no longer dismiss the modal.
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Task 4 — onCloseAutoFocus.preventDefault stops Radix from
          scrolling the page back to the originating chip when the modal
          closes after a successful save/delete. Without it the calendar
          briefly "jumps" as focus is restored mid-close animation. */}
      <DialogContent
        className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-0 bg-gray-50"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {renderCard()}
      </DialogContent>
    </Dialog>
  );
}
