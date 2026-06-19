
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, X } from 'lucide-react';
import { sampleEvents, weeklyColorMap, weeklyTitleMap, parseTimeRange } from '@/data/sampleEvents';
import { computeSiblingEvents } from '@/lib/eventSiblings';

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

const FILTERABLE_TYPES = ['not-reviewed', 'completed', 'cancelled'];

export default function WeeklyCalendarGrid({ currentDate, onEventClick, onEmptyClick, activeFilters = ['not-reviewed', 'completed', 'cancelled'], savedAvailabilitySlots = [], events = null }) {
    // When `events` is provided (an array, even empty), the grid is in LIVE mode
    // and renders real bookings; otherwise it falls back to the sampleEvents mock.
    const liveMode = Array.isArray(events);
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
        // Saved availability slots from the shared store carry full ISO
        // dates (YYYY-MM-DD) so they aren't gated by sameMonth — they show
        // up wherever the rendered weekday actually matches.
        const yyyy = day.getFullYear();
        const mm = String(day.getMonth() + 1).padStart(2, '0');
        const dd = String(day.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        // Picker's active dates come exclusively from savedAvailabilitySlots
        // (user-saved data). sampleEvents are intentionally excluded so the
        // popup card's date picker only highlights dates the teacher has
        // actually saved. Reparse 'YYYY-MM-DD' via local Date + toISOString so
        // the resulting ISO strings round-trip via `new Date(iso).getDate()`.
        const savedDates = Array.from(new Set(savedAvailabilitySlots.map((s) => {
            const [y, mo, d] = s.date.split('-').map(Number);
            return new Date(y, mo - 1, d).toISOString();
        })));
        const savedAvailEvents = savedAvailabilitySlots
            .filter((s) => s.date === isoDate && s.startTime && s.endTime)
            .map((s, i) => {
                const [sh, sm] = s.startTime.split(':');
                const [eh, em] = s.endTime.split(':');
                const startHour = parseInt(sh, 10) + parseInt(sm, 10) / 60;
                const endHour = parseInt(eh, 10) + parseInt(em, 10) / 60;
                return {
                    id: `saved-avail-${s.date}-${s.startTime}-${s.endTime}-${i}`,
                    type: 'availability',
                    role: 'T',
                    date: day.getDate(),
                    time: `${s.startTime} - ${s.endTime}`,
                    startHour,
                    endHour,
                    dayIndex,
                    dateString: day.toISOString(),
                    availableDatesForCategory: savedDates,
                };
            });

        let dayEvents;
        if (liveMode) {
            // LIVE: real bookings carry {year, month, date}; match the exact
            // weekday so events land on their true day (no cross-month repeat).
            dayEvents = events.filter((e) =>
                e.date === day.getDate() &&
                (e.year == null || e.year === day.getFullYear()) &&
                (e.month == null || e.month === day.getMonth()) &&
                (!FILTERABLE_TYPES.includes(e.type) || activeFilters.includes(e.type))
            );
        } else {
            // MOCK fallback: day-of-month match within the rendered month.
            const sameMonth =
                day.getMonth() === currentDate.getMonth() &&
                day.getFullYear() === currentDate.getFullYear();
            dayEvents = sameMonth
                ? sampleEvents.filter((e) =>
                    e.date === day.getDate() &&
                    (!FILTERABLE_TYPES.includes(e.type) || activeFilters.includes(e.type)))
                : [];
        }

        const enriched = dayEvents.map((e) => {
            const { startHour, endHour } = parseTimeRange(e.time);
            return {
                ...e,
                startHour,
                endHour,
                dayIndex,
                dateString: day.toISOString(),
                availableDatesForCategory: savedDates,
            };
        });

        return [...enriched, ...savedAvailEvents];
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
                                onEventClick={(e) =>
                                    onEventClick({
                                        ...e,
                                        siblingEvents: computeSiblingEvents(e, eventsByDayIndex[dayIndex]),
                                    })
                                }
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
