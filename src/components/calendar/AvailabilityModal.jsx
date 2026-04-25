
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Tab label per event type. Combined with the role to form labels like "Booked (S)".
const TYPE_TAB_LABEL = {
  availability: 'Availability',
  booked: 'Booked',
  cancelled: 'Cancelled',
  waiting: 'Waiting',
  'not-reviewed': 'Not Reviewed',
  completed: 'Completed',
};

// Render the right card for a single (type, role, reschedule) combo.
function renderCardFor(event, onClose) {
  switch (event.type) {
    case 'availability':
      if (event.role === 'S') return <TeacherAvailabilityStudentCard event={event} onClose={onClose} />;
      return <TeacherAvailabilityCard event={event} onClose={onClose} />;
    case 'booked':
      if (event.role === 'S') {
        if (event.reschedule) return <BookedAsStudentRescheduleCard event={event} onClose={onClose} />;
        return <BookedAsStudentCard event={event} onClose={onClose} />;
      }
      if (event.role === 'T' && event.reschedule) {
        return <BookedAsTeacherRescheduleCard event={event} onClose={onClose} />;
      }
      return <GlobalBookingCard event={event} onClose={onClose} />;
    case 'cancelled':
      if (event.role === 'T') return <CancellationFeesTeacherCard event={event} onClose={onClose} />;
      return <CancellationFeesCard event={event} onClose={onClose} />;
    case 'waiting':
      if (event.role === 'T') {
        if (event.reschedule) return <WaitingForConfirmationTeacherRescheduleCard event={event} onClose={onClose} />;
        return <WaitingForConfirmationTeacherCard event={event} onClose={onClose} />;
      }
      if (event.role === 'S') {
        if (event.reschedule) return <WaitingForConfirmationStudentRescheduleCard event={event} onClose={onClose} />;
        return <WaitingForConfirmationStudentCard event={event} onClose={onClose} />;
      }
      return <TeacherAvailabilityCard event={event} onClose={onClose} />;
    case 'not-reviewed':
      if (event.role === 'T') return <NotReviewedTeacherCard event={event} onClose={onClose} />;
      if (event.role === 'S') return <NotReviewedStudentCard event={event} onClose={onClose} />;
      return <TeacherAvailabilityCard event={event} onClose={onClose} />;
    case 'completed':
      if (event.role === 'T') return <CompletedTeacherCard event={event} onClose={onClose} />;
      if (event.role === 'S') return <CompletedStudentCard event={event} onClose={onClose} />;
      return <TeacherAvailabilityCard event={event} onClose={onClose} />;
    default:
      return <TeacherAvailabilityCard event={event} onClose={onClose} />;
  }
}

export default function AvailabilityModal({ event, events, isOpen, onClose }) {
  // Backward-compat: callers may pass a single `event` (weekly view) or an
  // `events` array (monthly view). Normalize to a list.
  const list = (events && events.length ? events : event ? [event] : []);
  if (!list.length) return null;

  // Group by role so each role becomes one tab. Multiple cards within a role
  // (e.g. booked-S regular + booked-S reschedule) stack inside the same tab.
  const byRole = list.reduce((acc, e) => {
    const role = e.role || '-';
    if (!acc[role]) acc[role] = [];
    acc[role].push(e);
    return acc;
  }, {});
  const roles = Object.keys(byRole);
  const showTabs = roles.length > 1;

  const typeLabel = TYPE_TAB_LABEL[list[0].type] || list[0].type;

  // Stable key so tab state resets when a different chip is opened.
  const tabsKey = list.map((e) => e.id).join('-');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto p-0 bg-gray-50">
        {showTabs ? (
          <Tabs key={tabsKey} defaultValue={roles[0]} className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}>
                {roles.map((role) => (
                  <TabsTrigger key={role} value={role}>
                    {typeLabel} ({role})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {roles.map((role) => (
              <TabsContent key={role} value={role} className="mt-0">
                <div className="space-y-4">
                  {byRole[role].map((e, idx) => (
                    <div key={e.id ?? idx}>{renderCardFor(e, onClose)}</div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4">
            {list.map((e, idx) => (
              <div key={e.id ?? idx}>{renderCardFor(e, onClose)}</div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
