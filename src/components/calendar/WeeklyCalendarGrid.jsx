
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, X } from 'lucide-react';
import { sampleEvents, weeklyColorMap, weeklyTitleMap, parseTimeRange } from '@/data/sampleEvents';

const EventIcon = ({ type }) => {
    switch (type) {
        case 'booked': return <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>;
        case 'not-reviewed': return <X className="w-4 h-4 text-red-500 mr-2" />;
        case 'completed': return <DollarSign className="w-4 h-4 text-gray-800 mr-2" />;
        case 'cancelled': return <X className="w-4 h-4 text-gray-600 mr-2" />;
        case 'availability': return <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>;
        case 'waiting': return <User className="w-4 h-4 text-pink-500 mr-2" />;
        case 'synced': return <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>;
        default: return <Clock className="w-4 h-4 mr-2" />;
    }
};

const EventCard = ({ event, onEventClick }) => {
    const roleDisplay = event.role ? `(${event.role})` : '';
    const colorClass = weeklyColorMap[event.color] || 'border-l-4 border-gray-400 bg-gray-50';
    const title = weeklyTitleMap[event.type] || event.type;
    const studentOrTeacher = event.student || event.teacher;
    return (
        <div
            className={`absolute p-2 text-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
            style={{
                top: `${event.startHour * 3.5}rem`,
                height: `${Math.max(event.endHour - event.startHour, 1) * 3.5}rem`,
                left: '0.25rem',
                right: '0.25rem',
            }}
            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
        >
            <div className="flex items-start">
                <EventIcon type={event.type} />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between w-full">
                      <p className="font-semibold text-gray-800 truncate">{event.time}</p>
                      {roleDisplay && <p className="font-bold text-gray-600 pr-2">{roleDisplay}</p>}
                    </div>
                    <p className="text-gray-600 truncate">{title}</p>
                    {event.type === 'waiting' && <p className="text-red-500 font-bold">Waiting</p>}
                    {studentOrTeacher && <Badge variant="secondary" className="mt-1">{studentOrTeacher}</Badge>}
                </div>
            </div>
        </div>
    );
};

export default function WeeklyCalendarGrid({ currentDate, onEventClick, onEmptyClick }) {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    const getWeekDays = (date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    };

    const weekDays = getWeekDays(currentDate);
    const today = new Date();

    // Build per-day enriched events from the shared sampleEvents source.
    // An event is shown on weekday `i` if its `date` matches that day's day-of-month
    // AND the day falls in the same month/year as `currentDate` (matches monthly view's filter).
    const eventsByDayIndex = weekDays.map((day, dayIndex) => {
        const sameMonth =
            day.getMonth() === currentDate.getMonth() &&
            day.getFullYear() === currentDate.getFullYear();
        if (!sameMonth) return [];

        const dayEvents = sampleEvents.filter((e) => e.date === day.getDate());

        // Build the same `availableDatesForCategory` that monthly produces for SyncedEventsModal etc.
        const allDatesByCategory = {};
        sampleEvents.forEach((e) => {
            const key = `${e.type}-${e.role || ''}`;
            const iso = new Date(currentDate.getFullYear(), currentDate.getMonth(), e.date).toISOString();
            if (!allDatesByCategory[key]) allDatesByCategory[key] = new Set();
            allDatesByCategory[key].add(iso);
        });

        return dayEvents.map((e) => {
            const { startHour, endHour } = parseTimeRange(e.time);
            const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), e.date).toISOString();
            const key = `${e.type}-${e.role || ''}`;
            const availableDatesForCategory = Array.from(allDatesByCategory[key] || []);
            return {
                ...e,
                startHour,
                endHour,
                dayIndex,
                dateString,
                availableDatesForCategory,
            };
        });
    });

    return (
        <div className="relative grid grid-cols-[auto_1fr] min-w-[800px] overflow-x-auto">
            {/* Time Gutter */}
            <div className="flex flex-col">
                <div className="h-12 border-b"></div>
                {hours.map((hour) => (
                    <div key={hour} className="h-14 flex items-start justify-center pr-2">
                        <span className="text-xs text-gray-500">{hour}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1">
                {/* Day Headers */}
                {weekDays.map((day, index) => {
                    const isToday =
                        day.getDate() === today.getDate() &&
                        day.getMonth() === today.getMonth() &&
                        day.getFullYear() === today.getFullYear();
                    return (
                        <div key={index} className="flex flex-col items-center p-2 border-b border-l h-12">
                            <span className="text-xs text-gray-600">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className={`text-lg font-semibold ${isToday ? 'bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                                {day.getDate()}
                            </span>
                        </div>
                    );
                })}

                {/* Day Columns */}
                {weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="relative border-l">
                        {/* Hour Cells */}
                        {hours.map((_, hourIndex) => (
                            <div
                                key={hourIndex}
                                title="Add New Booking Or Availability"
                                onClick={() => onEmptyClick && onEmptyClick(dayIndex, hourIndex)}
                                className="h-14 border-b cursor-pointer hover:bg-blue-50"
                            ></div>
                        ))}

                        {/* Events for this day */}
                        {eventsByDayIndex[dayIndex].map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onEventClick={onEventClick}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
