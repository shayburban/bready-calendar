
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import NavigationWithinLegend from './NavigationWithinLegend';
import { synthesizeSavedAvailEvent, dayOfMonthFromSlot } from '@/lib/eventSiblings';
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

export default function AvailabilityModal({ event, isOpen, onClose, savedAvailabilitySlots = [] }) {
  // Global picker highlight list — sourced ONCE from savedAvailabilitySlots so
  // the calendar highlights the same days regardless of which sibling chip is
  // active (Bug 1 fix). Output format matches what CalendarWithinCalendarCards
  // already accepts (full ISO via local Date + toISOString reparse).
  const globalSavedDates = useMemo(() => {
    return Array.from(new Set((savedAvailabilitySlots || []).map((s) => {
      const [y, m, d] = s.date.split('-').map(Number);
      return new Date(y, m - 1, d).toISOString();
    })));
  }, [savedAvailabilitySlots]);

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
    const isOriginalDate = activeDate === event.dateString;
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
    // Different date picked via the picker — synthesize sibling-shaped events
    // from savedAvailabilitySlots filtered to that day.
    const activeYMD = format(new Date(activeDate), 'yyyy-MM-dd');
    const matched = (savedAvailabilitySlots || [])
      .filter((s) => s.date === activeYMD && s.startTime && s.endTime)
      .slice()
      .sort((a, b) => {
        const am = parseInt(a.startTime.split(':')[0], 10) * 60 + parseInt(a.startTime.split(':')[1], 10);
        const bm = parseInt(b.startTime.split(':')[0], 10) * 60 + parseInt(b.startTime.split(':')[1], 10);
        return am - bm;
      });
    return matched.map((s, idx) =>
      synthesizeSavedAvailEvent(s, dayOfMonthFromSlot(s) ?? 1, activeDate, idx)
    );
  }, [event, activeDate, savedAvailabilitySlots]);

  const [selectedTime, setSelectedTime] = useState(event?.time || '');

  useEffect(() => {
    if (event?.time) setSelectedTime(event.time);
  }, [event]);

  // Picker → date change handler. Updates activeDate AND snaps the active
  // chip to the first slot of the newly selected day so the modal content
  // (chips, "Your Availability" text, form details) follows (Bug 2 fix).
  const handleDateChange = (newDateISO) => {
    if (!newDateISO) return;
    setActiveDate(newDateISO);
    const newYMD = format(new Date(newDateISO), 'yyyy-MM-dd');
    const matched = (savedAvailabilitySlots || [])
      .filter((s) => s.date === newYMD && s.startTime && s.endTime)
      .slice()
      .sort((a, b) => {
        const am = parseInt(a.startTime.split(':')[0], 10) * 60 + parseInt(a.startTime.split(':')[1], 10);
        const bm = parseInt(b.startTime.split(':')[0], 10) * 60 + parseInt(b.startTime.split(':')[1], 10);
        return am - bm;
      });
    setSelectedTime(matched.length > 0 ? `${matched[0].startTime} - ${matched[0].endTime}` : '');
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
  // follows; override availableDatesForCategory so the picker always shows
  // the global savedAvailabilitySlots highlights regardless of which sibling
  // chip is currently active (Bug 1 fix).
  const activeEvent = {
    ...baseActive,
    dateString: activeDate,
    slotHeader,
    availableDatesForCategory: globalSavedDates,
  };

  const renderCard = () => {
    switch (activeEvent.type) {
      case 'availability':
        if (activeEvent.role === 'S') return <TeacherAvailabilityStudentCard event={activeEvent} onClose={onClose} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} onDateChange={handleDateChange} />;
      case 'booked':
        if (activeEvent.role === 'S') {
          if (activeEvent.reschedule) return <BookedAsStudentRescheduleCard event={activeEvent} onClose={onClose} />;
          return <BookedAsStudentCard event={activeEvent} onClose={onClose} />;
        }
        if (activeEvent.role === 'T' && activeEvent.reschedule) {
          return <BookedAsTeacherRescheduleCard event={activeEvent} onClose={onClose} />;
        }
        return <GlobalBookingCard event={activeEvent} onClose={onClose} />;
      case 'cancelled':
        if (activeEvent.role === 'T') return <CancellationFeesTeacherCard event={activeEvent} onClose={onClose} />;
        return <CancellationFeesCard event={activeEvent} onClose={onClose} />;
      case 'waiting':
        if (activeEvent.role === 'T') {
          if (activeEvent.reschedule) return <WaitingForConfirmationTeacherRescheduleCard event={activeEvent} onClose={onClose} />;
          return <WaitingForConfirmationTeacherCard event={activeEvent} onClose={onClose} />;
        }
        if (activeEvent.role === 'S') {
          if (activeEvent.reschedule) return <WaitingForConfirmationStudentRescheduleCard event={activeEvent} onClose={onClose} />;
          return <WaitingForConfirmationStudentCard event={activeEvent} onClose={onClose} />;
        }
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} />;
      case 'not-reviewed':
        if (activeEvent.role === 'T') return <NotReviewedTeacherCard event={activeEvent} onClose={onClose} />;
        if (activeEvent.role === 'S') return <NotReviewedStudentCard event={activeEvent} onClose={onClose} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} />;
      case 'completed':
        if (activeEvent.role === 'T') return <CompletedTeacherCard event={activeEvent} onClose={onClose} />;
        if (activeEvent.role === 'S') return <CompletedStudentCard event={activeEvent} onClose={onClose} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} />;
      default:
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-0 bg-gray-50">
        {renderCard()}
      </DialogContent>
    </Dialog>
  );
}
