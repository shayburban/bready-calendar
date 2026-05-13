
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import NavigationWithinLegend from './NavigationWithinLegend';
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

export default function AvailabilityModal({ event, isOpen, onClose }) {
  // Combined slot list: clicked event always first, then same-day siblings
  // of identical type+role sorted chronologically. Time string is the slot
  // identity used for de-dup.
  const allSlots = useMemo(() => {
    if (!event) return [];
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
  }, [event]);

  const [selectedTime, setSelectedTime] = useState(event?.time || '');

  useEffect(() => {
    if (event?.time) setSelectedTime(event.time);
  }, [event]);

  if (!event) return null;

  const baseActive = allSlots.find((s) => s.time === selectedTime) || event;
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
  const activeEvent = { ...baseActive, slotHeader };

  const renderCard = () => {
    switch (activeEvent.type) {
      case 'availability':
        if (activeEvent.role === 'S') return <TeacherAvailabilityStudentCard event={activeEvent} onClose={onClose} />;
        return <TeacherAvailabilityCard event={activeEvent} onClose={onClose} />;
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
