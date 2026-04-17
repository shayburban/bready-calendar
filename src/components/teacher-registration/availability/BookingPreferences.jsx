import React from 'react';
import { useTeacher } from '../TeacherContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Coffee } from 'lucide-react';

const BookingPreferences = () => {
    const { availability, dispatchAvailability, errors } = useTeacher();

    const handleAdvanceBookingChange = (value) => {
        const [num, type] = value.split('-');
        dispatchAvailability({ type: 'ADVANCE_BOOK_P', value: parseInt(num) });
        dispatchAvailability({ type: 'ADVANCE_BOOK_P_TYPE', value: type });
    };

    const handleWindowChange = (value) => {
        const [num, type] = value.split('-');
        dispatchAvailability({ type: 'A_WINDOW_P', value: parseInt(num) });
        dispatchAvailability({ type: 'A_WINDOW_P_TYPE', value: type });
    };

    const handleBreakChange = (value) => {
        dispatchAvailability({ type: 'BREAK_AC', value: parseInt(value) });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Preferences
                </CardTitle>
                <p className="text-sm text-gray-500">Set your booking policies to help students understand your availability.</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="availability-window" className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Set your availability for
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">Define how far into the future you want to be available for bookings.</p>
                    <Select
                        onValueChange={handleWindowChange}
                        value={availability.availabilityWindow.preference && availability.availabilityWindow.preferenceType ? 
                            `${availability.availabilityWindow.preference}-${availability.availabilityWindow.preferenceType}` : ""}
                    >
                        <SelectTrigger id="availability-window" className={errors.availabilityWindow ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select availability window..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2-weeks">Rolling 2 weeks</SelectItem>
                            <SelectItem value="1-months">Rolling 1 month</SelectItem>
                            <SelectItem value="3-months">Rolling 3 months</SelectItem>
                            <SelectItem value="0-indefinitely">Indefinitely</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.availabilityWindow && (
                        <p className="text-red-500 text-sm mt-1">{errors.availabilityWindow}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="advance-booking" className="text-base font-semibold text-gray-800">Notice period</Label>
                    <p className="text-sm text-gray-500 mb-2">Set how far in advance students must book a session with you.</p>
                    <Select
                        onValueChange={handleAdvanceBookingChange}
                        value={availability.farAdvanceBookingFromStudent.preference && availability.farAdvanceBookingFromStudent.preferenceType ? 
                            `${availability.farAdvanceBookingFromStudent.preference}-${availability.farAdvanceBookingFromStudent.preferenceType}` : ""}
                    >
                        <SelectTrigger id="advance-booking" className={errors.farAdvanceBookingFromStudent ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select notice period..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12-hours">At least 12 hours in advance</SelectItem>
                            <SelectItem value="24-hours">At least 24 hours in advance</SelectItem>
                            <SelectItem value="2-days">At least 2 days in advance</SelectItem>
                            <SelectItem value="3-days">At least 3 days in advance</SelectItem>
                            <SelectItem value="7-days">At least 1 week in advance</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.farAdvanceBookingFromStudent && (
                        <p className="text-red-500 text-sm mt-1">{errors.farAdvanceBookingFromStudent}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="break-time" className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Booking break
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">Set a break time after each session to prevent back-to-back bookings.</p>
                    <Select
                        onValueChange={handleBreakChange}
                        value={availability.breakAfterClassInHours?.toString() ?? ""}
                    >
                        <SelectTrigger id="break-time" className={errors.breakAfterClassInHours ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select break time..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">No break</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.breakAfterClassInHours && (
                        <p className="text-red-500 text-sm mt-1">{errors.breakAfterClassInHours}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default BookingPreferences;