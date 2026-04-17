
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, X } from 'lucide-react';

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
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
            {getEventTypeLabel(event.type)}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{event.time}</span>
          </div>
          
          {event.date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{event.date}</span>
            </div>
          )}
          
          {event.student && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>Student: {event.student}</span>
            </div>
          )}
          
          {event.type === 'booked' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                This session is confirmed and ready to start.
              </p>
            </div>
          )}
          
          {event.type === 'not-reviewed' && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">
                This booking requires your review and confirmation.
              </p>
            </div>
          )}
          
          {event.type === 'waiting' && (
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm text-pink-700">
                Waiting for student confirmation. You'll be notified once confirmed.
              </p>
            </div>
          )}
          
          {event.description && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          {event.type === 'not-reviewed' && (
            <>
              <Button variant="outline" size="sm">
                Decline
              </Button>
              <Button size="sm">
                Accept
              </Button>
            </>
          )}
          {event.type === 'booked' && (
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
