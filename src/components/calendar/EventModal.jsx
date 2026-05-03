
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, X } from 'lucide-react';
import NavigationWithinLegend from './NavigationWithinLegend';

const startMinutesOf = (e) => {
  if (typeof e.startHour === 'number') return e.startHour * 60;
  const m = (e.time || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
};

const getEventTypeColor = (type) => {
  const colors = {
    'not-reviewed': 'bg-red-500',
    'booked': 'bg-orange-500',
    'availability': 'bg-green-500',
    'completed': 'bg-gray-700',
    'cancelled': 'bg-gray-600',
    'synced': 'bg-blue-500',
    'sequence-saved': 'bg-teal-400',
    'sequence-edited': 'bg-teal-200',
    'waiting': 'bg-pink-200'
  };
  return colors[type] || 'bg-gray-500';
};

const getEventTypeLabel = (type) => {
  const labels = {
    'not-reviewed': 'Not Reviewed',
    'booked': 'Booked',
    'availability': 'Availability',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'synced': 'Synced Calendar Events',
    'sequence-saved': 'Sequence Saved',
    'sequence-edited': 'Sequence Edited',
    'waiting': 'Waiting For Confirmation'
  };
  return labels[type] || type;
};

export default function EventModal({ event, isOpen, onClose }) {
  const allSlots = useMemo(() => {
    if (!event) return [];
    const merged = [event, ...(event.siblingEvents || [])];
    const seen = new Set();
    const dedup = [];
    merged.forEach((e) => {
      if (!e?.time || seen.has(e.time)) return;
      seen.add(e.time);
      dedup.push(e);
    });
    dedup.sort((a, b) => startMinutesOf(a) - startMinutesOf(b));
    return dedup;
  }, [event]);

  const [selectedTime, setSelectedTime] = useState(event?.time || '');

  useEffect(() => {
    if (event?.time) setSelectedTime(event.time);
  }, [event]);

  if (!event) return null;

  const activeEvent = allSlots.find((s) => s.time === selectedTime) || event;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getEventTypeColor(activeEvent.type)}`}></div>
            {getEventTypeLabel(activeEvent.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{activeEvent.time}</span>
          </div>

          {activeEvent.date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{activeEvent.date}</span>
            </div>
          )}

          {allSlots.length > 1 && (
            <div className="border-b pb-3">
              <NavigationWithinLegend
                timeSlots={allSlots.map((s) => s.time)}
                activeSlot={selectedTime}
                onSlotSelect={setSelectedTime}
              />
            </div>
          )}

          {activeEvent.student && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>Student: {activeEvent.student}</span>
            </div>
          )}

          {activeEvent.type === 'booked' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                This session is confirmed and ready to start.
              </p>
            </div>
          )}

          {activeEvent.type === 'not-reviewed' && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">
                This booking requires your review and confirmation.
              </p>
            </div>
          )}

          {activeEvent.type === 'waiting' && (
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm text-pink-700">
                Waiting for student confirmation. You'll be notified once confirmed.
              </p>
            </div>
          )}

          {activeEvent.description && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-gray-600">{activeEvent.description}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {activeEvent.type === 'not-reviewed' && (
            <>
              <Button variant="outline" size="sm">
                Decline
              </Button>
              <Button size="sm">
                Accept
              </Button>
            </>
          )}
          {activeEvent.type === 'booked' && (
            <Button size="sm">
              Join Session
            </Button>
          )}
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
