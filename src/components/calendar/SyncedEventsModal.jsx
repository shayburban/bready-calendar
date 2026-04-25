import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function MiniMonth({ activeDates, todayDate, monthDate }) {
  const [cursor, setCursor] = useState(monthDate || new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long' });
  const todayLabel = (todayDate || new Date()).toDateString();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const prevLast = new Date(year, month, 0).getDate();
    const startDay = first.getDay();
    const arr = [];
    for (let i = startDay - 1; i >= 0; i--) arr.push({ d: prevLast - i, prev: true });
    for (let d = 1; d <= last.getDate(); d++) arr.push({ d, current: true });
    while (arr.length % 7 !== 0) arr.push({ d: arr.length - last.getDate() - startDay + 1, next: true });
    return arr;
  }, [year, month]);

  const activeSet = new Set((activeDates || []).map(Number));
  const todayDay =
    todayDate &&
    todayDate.getFullYear() === year &&
    todayDate.getMonth() === month
      ? todayDate.getDate()
      : null;

  return (
    <div className="bg-white shadow-sm rounded-md p-3 mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-1 text-gray-500 hover:text-gray-800">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold">{monthLabel}</p>
          <p className="text-xs text-gray-500">{todayLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-1 text-gray-500 hover:text-gray-800">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-xs gap-y-1">
        {days.map((cell, i) => {
          const isCurrent = !!cell.current;
          const isActive = isCurrent && activeSet.has(cell.d);
          const isToday = isCurrent && cell.d === todayDay;
          return (
            <div key={i} className="py-1">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday
                    ? 'bg-blue-600 text-white font-semibold'
                    : isActive
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : isCurrent
                    ? 'text-gray-700'
                    : 'text-gray-300'
                }`}>
                {cell.d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SyncedEventsModal({ event, isOpen, onClose }) {
  const [active, setActive] = useState(0);
  if (!event) return null;

  const dateString = event.dateString ? new Date(event.dateString) : new Date();
  const dateLabel = dateString.toLocaleDateString('en-GB').replaceAll('/', '.');

  const timeSlots =
    event.timeSlots && event.timeSlots.length > 0
      ? event.timeSlots
      : event.time
      ? [event.time]
      : ['15:00 - 16:00', '17:00 - 19:00'];

  const activeDates =
    event.availableDatesForCategory
      ? event.availableDatesForCategory.map((iso) => new Date(iso).getDate())
      : [dateString.getDate()];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Synced Calendar Events
          </DialogTitle>
        </DialogHeader>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 py-2">
              {dateLabel}
              <ChevronDown className="h-4 w-4" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <MiniMonth
              activeDates={activeDates}
              todayDate={new Date()}
              monthDate={dateString}
            />
          </CollapsibleContent>
        </Collapsible>

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
