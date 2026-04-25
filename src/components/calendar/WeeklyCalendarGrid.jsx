
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, User, DollarSign, X } from 'lucide-react';
import EventModal from './EventModal';
import AvailabilityModal from './AvailabilityModal';

// Enhanced sample events for weekly view matching the legend
const sampleEvents = [
    { 
        id: 1, dayIndex: 2, startHour: 1, endHour: 2, 
        title: 'Booked Session', type: 'booked', role: 'S', student: 'Joan P.', 
        color: 'border-l-4 border-orange-500 bg-orange-50',
        time: '11:00 - 14:00',
        description: 'Mathematics tutoring session'
    },
    { 
        id: 2, dayIndex: 4, startHour: 1, endHour: 2, 
        title: 'Booked Session', type: 'booked', role: 'S', student: 'Joan P.', 
        color: 'border-l-4 border-orange-500 bg-orange-50',
        time: '11:00 - 14:00',
        description: 'Science tutoring session'
    },
    { 
        id: 3, dayIndex: 2, startHour: 2, endHour: 4, 
        title: 'Not Reviewed', type: 'not-reviewed', role: 'T',
        color: 'border-l-4 border-red-500 bg-red-50',
        time: '11:00 - 14:00',
        description: 'Pending review session'
    },
    { 
        id: 4, dayIndex: 4, startHour: 2, endHour: 4, 
        title: 'Not Reviewed', type: 'not-reviewed', role: 'S', 
        color: 'border-l-4 border-red-500 bg-red-50',
        time: '11:00 - 14:00',
        description: 'Requires confirmation'
    },
    { 
        id: 5, dayIndex: 4, startHour: 4, endHour: 6, 
        title: 'Not Reviewed', type: 'not-reviewed', role: 'S', 
        color: 'border-l-4 border-red-500 bg-red-50',
        time: '11:00 - 14:00',
        description: 'Student booking request'
    },
    { 
        id: 6, dayIndex: 2, startHour: 8, endHour: 9, 
        title: 'Completed', type: 'completed', role: 'T', 
        color: 'border-l-4 border-gray-700 bg-gray-100',
        time: '11:00 - 14:00',
        description: 'Session completed successfully'
    },
    { 
        id: 7, dayIndex: 4, startHour: 8, endHour: 9, 
        title: 'Completed', type: 'completed', role: 'S', 
        color: 'border-l-4 border-gray-700 bg-gray-100',
        time: '11:00 - 14:00',
        description: 'Payment received'
    },
    { 
        id: 8, dayIndex: 2, startHour: 10, endHour: 11, 
        title: 'Cancelled', type: 'cancelled', role: 'S', 
        color: 'border-l-4 border-gray-600 bg-gray-50',
        time: '11:00 - 14:00',
        description: 'Session cancelled by student'
    },
    { 
        id: 9, dayIndex: 4, startHour: 10, endHour: 11, 
        title: 'Cancelled', type: 'cancelled', role: 'T', 
        color: 'border-l-4 border-gray-600 bg-gray-50',
        time: '11:00 - 14:00',
        description: 'Technical issues'
    },
    {
        id: 10, dayIndex: 1, startHour: 5, endHour: 7,
        title: 'My Availability', type: 'availability', role: 'T',
        color: 'border-l-4 border-green-500 bg-green-50',
        time: '15:00 - 17:00',
        description: 'Teacher is available'
    },
    {
        id: 11, dayIndex: 3, startHour: 6, endHour: 8,
        title: 'Open Slot', type: 'availability', role: 'T',
        color: 'border-l-4 border-green-500 bg-green-50',
        time: '16:00 - 18:00',
        description: 'Available for booking'
    }
];

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
    return (
        <div 
            className={`absolute w-full p-2 text-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
            style={{
                top: `${event.startHour * 3.5}rem`,
                height: `${(event.endHour - event.startHour) * 3.5}rem`,
                left: '0.25rem',
                right: '0.25rem',
                width: 'calc(100% - 0.5rem)',
            }}
            onClick={() => onEventClick(event)}
        >
            <div className="flex items-start">
                <EventIcon type={event.type} />
                <div className="flex-1"> {/* Use flex-1 to allow content to take available space */}
                    <div className="flex justify-between w-full">
                      <p className="font-semibold text-gray-800">{event.time}</p>
                      {roleDisplay && <p className="font-bold text-gray-600 pr-2">{roleDisplay}</p>}
                    </div>
                    <p className="text-gray-600">{event.title}</p>
                    {event.type === 'waiting' && <p className="text-red-500 font-bold">Waiting</p>}
                    {event.student && <Badge variant="secondary">{event.student}</Badge>}
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

    return (
        <div className="relative grid grid-cols-[auto_1fr] min-w-[800px] overflow-x-auto">
            {/* Time Gutter */}
            <div className="flex flex-col">
                <div className="h-12 border-b"></div> {/* Empty corner */}
                {hours.map(hour => (
                    <div key={hour} className="h-14 flex items-start justify-center pr-2">
                        <span className="text-xs text-gray-500">{hour}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1">
                {/* Day Headers */}
                {weekDays.map((day, index) => {
                     const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth();
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
                        {sampleEvents.filter(e => e.dayIndex === dayIndex).map(event => (
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
