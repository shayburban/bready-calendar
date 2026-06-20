import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CardDateDropdown from './CardDateDropdown';
import { categoryDatesForPicker, eventsForDate } from '@/lib/calendar/categoryDates';

export default function SyncedEventsModal({ event, isOpen, onClose, events = [] }) {
  // The modal owns the active date so the picker can re-hydrate the synced
  // time-slot list WITHOUT closing (spec #3). Re-seed when a new event opens.
  const [activeDate, setActiveDate] = useState(event?.dateString || '');
  useEffect(() => {
    if (event?.dateString) setActiveDate(event.dateString);
  }, [event?.dateString]);

  const [active, setActive] = useState(0);
  // Reset the selected slot whenever the active date changes.
  useEffect(() => {
    setActive(0);
  }, [activeDate]);

  // Dates that have a synced event (spec #1 + #2). Synced events carry no role,
  // so we match on type alone (role undefined === undefined inside the helper).
  const availableDates = useMemo(() => {
    if (!event) return [];
    return categoryDatesForPicker({
      events,
      type: 'synced',
      role: event.role,
      center: event.dateString ? new Date(event.dateString) : new Date(),
    });
  }, [event, events]);

  // Synced time slots for the active date (spec #3). On the originally-clicked
  // day use the clicked event (+ its same-day siblings); on a newly-picked day
  // use the master synced events for that date. Never renders an empty list.
  const timeSlots = useMemo(() => {
    if (!event) return [];
    const isOriginal = !activeDate || activeDate === event.dateString;
    const matched = isOriginal
      ? [event, ...(event.siblingEvents || [])]
      : eventsForDate({ events, type: 'synced', role: event.role, dateISO: activeDate });
    const out = [];
    matched.forEach((e) => {
      if (Array.isArray(e?.timeSlots) && e.timeSlots.length) out.push(...e.timeSlots);
      else if (e?.time) out.push(e.time);
    });
    if (out.length) return out;
    if (Array.isArray(event.timeSlots) && event.timeSlots.length) return event.timeSlots;
    return event.time ? [event.time] : ['15:00 - 16:00', '17:00 - 19:00'];
  }, [event, activeDate, events]);

  const handleDateChange = (iso) => {
    if (iso) setActiveDate(iso);
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Synced Calendar Events
          </DialogTitle>
        </DialogHeader>

        {/* Contextual date dropdown — only days that actually have a synced
            event are enabled; picking one re-hydrates the slot list below
            without closing the popup (spec #1–#3). */}
        <CardDateDropdown
          selectedDate={activeDate || event?.dateString}
          availableDates={availableDates}
          onDateChange={handleDateChange}
        />

        <ul className="flex flex-col items-center gap-2 mt-2">
          {timeSlots.map((slot, i) => (
            <li key={i} className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-full px-6 py-1.5 text-sm border transition-colors ${
                  active === i
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                }`}>
                {slot}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
