import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function CalendarGrid({
  currentDate,
  view,
  events,
  onEventClick,
  onDateClick,
  timezone
}) {
  const getEventColor = (event) => {
    switch (event.type) {
      case 'availability':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booking':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sync':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (event) => {
    switch (event.type) {
      case 'availability':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'booking':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'completed':
        return <span className="text-xs">$</span>;
      case 'cancelled':
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
      case 'waiting':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'sync':
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const generateCalendarDays = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startDate.getDay();
    const daysInMonth = endDate.getDate();

    const days = [];
    
    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonth.getDate() - i)
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: fullDate.toDateString() === today.toDateString(),
        fullDate
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day)
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const days = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekdays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="flex-1 grid grid-cols-7 gap-0 overflow-auto">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day.fullDate);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={index}
              className={`
                min-h-[120px] border-r border-b p-2 cursor-pointer hover:bg-gray-50 relative
                ${!day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                ${day.isToday ? 'bg-blue-50' : ''}
              `}
              onClick={() => onDateClick(day.fullDate)}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-medium
                  ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                `}>
                  {day.date}
                </span>
                {hasEvents && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-blue-600 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(day.fullDate);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-xs px-2 py-1 rounded border cursor-pointer truncate
                      ${getEventColor(event)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      {getEventIcon(event)}
                      <span className="flex-1 truncate">
                        {event.start.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <div className="truncate font-medium">
                      {event.title}
                    </div>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}