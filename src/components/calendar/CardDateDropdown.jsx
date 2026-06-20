import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDown } from 'lucide-react';
import CalendarWithinCalendarCards from './CalendarWithinCalendarCards';

// Shared "date with dropdown calendar" used by every popup card in the calendar.
//
// Behavior (the contract the cards rely on):
//   1. Contextual filtering — the dropdown is NOT a plain open calendar. When
//      `availableDates` is supplied it renders the filtered
//      CalendarWithinCalendarCards, which greys out + disables every date that
//      does NOT have an event of the card's type/role and enables only the ones
//      that do.
//   2. On click of an ENABLED date it calls `onDateChange(isoString)` (and the
//      popover closes) — it does NOT close the popup card. The host modal uses
//      that callback to re-hydrate the whole card for the new date.
//   3. Graceful fallback — when no `availableDates` are known for this card's
//      type (e.g. a type with no per-date data yet), it falls back to a plain
//      all-enabled calendar so the control is never an empty/all-disabled grid.
//
// Props:
//   selectedDate  — Date | ISO/parsable string. The currently active date.
//   availableDates— Array<Date|ISO> the dates that have a matching-type event.
//   onDateChange  — (isoString) => void. Fired when an enabled date is picked.
//   buttonClassName — optional override for the trigger button.
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export default function CardDateDropdown({
  selectedDate,
  availableDates,
  onDateChange,
  buttonClassName = 'w-full justify-center flex items-center gap-2 mb-2',
}) {
  const [open, setOpen] = useState(false);
  const dateObj = toDate(selectedDate) || new Date();
  const hasFilter = Array.isArray(availableDates) && availableDates.length > 0;

  const emit = (iso) => {
    setOpen(false);
    if (typeof onDateChange === 'function' && iso) onDateChange(iso);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={buttonClassName}>
          <span>{dateObj.toLocaleDateString('de-DE')}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {hasFilter ? (
          // Contextual, type-filtered calendar (spec #1 + #2). Selecting an
          // enabled date emits the ISO string up to the host for re-hydration.
          <CalendarWithinCalendarCards
            availableDates={availableDates}
            selectedDate={dateObj}
            onDateChange={emit}
          />
        ) : (
          // Fallback: plain all-enabled calendar (no per-date data for this
          // type). Still emits the picked date so re-hydration keeps working.
          <Calendar
            mode="single"
            selected={dateObj}
            onSelect={(d) => d && emit(d.toISOString())}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
