import React, { useState } from 'react';
import { useTeacher } from '../TeacherContext';
import { Button } from '@/components/ui/button';
import TimeSlotManager from './TimeSlotManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyScheduler = () => {
    const { availability, dispatchAvailability, errors } = useTeacher();
    const [selectedDay, setSelectedDay] = useState('Monday');

    const formatTime = (hour) => {
        const h = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
        return `${h}:00 ${ampm}`;
    };

    const handleDeleteSlot = (day, index) => {
        dispatchAvailability({ type: 'DELETE_CUSTOM_SLOT', value: { day, index } });
    };

    const getTotalSlotsCount = () => {
        return Object.values(availability.slots).reduce((total, daySlots) => {
            return total + (daySlots ? daySlots.length : 0);
        }, 0);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Set Your Weekly Hours
                </CardTitle>
                <p className="text-sm text-gray-500">Define your standard weekly availability. You can always override this for specific dates later.</p>
                {errors.timeSlots && (
                    <p className="text-red-500 text-sm">{errors.timeSlots}</p>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex border-b mb-6 space-x-2 overflow-x-auto pb-2">
                    {DAYS_OF_WEEK.map(day => (
                        <Button
                            key={day}
                            variant={selectedDay === day ? 'default' : 'outline'}
                            onClick={() => setSelectedDay(day)}
                            className="shrink-0 relative"
                        >
                            {day}
                            {availability.slots[day.toLowerCase()]?.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                    {availability.slots[day.toLowerCase()].length}
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Add available slots for {selectedDay}
                        </h3>
                        <TimeSlotManager day={selectedDay} />
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">
                            Current Availability 
                            <Badge variant="outline" className="ml-2">
                                {getTotalSlotsCount()} slots total
                            </Badge>
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Object.entries(availability.slots)
                                .sort(([a], [b]) => DAYS_OF_WEEK.indexOf(a.charAt(0).toUpperCase() + a.slice(1)) - DAYS_OF_WEEK.indexOf(b.charAt(0).toUpperCase() + b.slice(1)))
                                .map(([day, slots]) => (
                                slots && slots.length > 0 && (
                                    <div key={day} className="p-3 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium capitalize text-gray-800 mb-2">{day}</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {slots.map((slot, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                                    <span className="text-sm font-mono text-gray-700">
                                                        {formatTime(slot.startHour)} - {formatTime(slot.endHour)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {slot.startHour < 12 ? 'Morning' : slot.startHour < 17 ? 'Afternoon' : 'Evening'}
                                                        </Badge>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6" 
                                                            onClick={() => handleDeleteSlot(day, index)}
                                                        >
                                                            <X className="h-3 w-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            {getTotalSlotsCount() === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No availability set yet.</p>
                                    <p className="text-xs">Select a day above and add your first time slot.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default WeeklyScheduler;