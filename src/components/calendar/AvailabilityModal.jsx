
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TeacherAvailabilityCard from './TeacherAvailabilityCard';
import GlobalBookingCard from './GlobalBookingCard';
import BookedAsStudentCard from './BookedAsStudentCard';
import CancellationFeesCard from './CancellationFeesCard';
import CancellationFeesTeacherCard from './CancellationFeesTeacherCard';

export default function AvailabilityModal({ event, isOpen, onClose }) {
  if (!event) return null;

  // Decide which card to show based on the event type
  const renderCard = () => {
    switch(event.type) {
        case 'availability':
            return <TeacherAvailabilityCard event={event} onClose={onClose} />;
        case 'booked':
            if (event.role === 'S') {
                return <BookedAsStudentCard event={event} onClose={onClose} />;
            }
            return <GlobalBookingCard event={event} onClose={onClose} />;
        case 'cancelled':
            if (event.role === 'T') {
                return <CancellationFeesTeacherCard event={event} onClose={onClose} />;
            }
            return <CancellationFeesCard event={event} onClose={onClose} />;
        default:
            // Fallback for other types or if type is not specified
            return <TeacherAvailabilityCard event={event} onClose={onClose} />;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto p-0 bg-gray-50">
        {/* onInteractOutside is removed to allow closing, it will be handled by the popover inside */}
        {renderCard()}
      </DialogContent>
    </Dialog>
  );
}
