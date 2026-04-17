import React, { useState } from 'react';
import { useTeacher } from '../TeacherContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
        const hour = i;
        const displayHour = i % 12 === 0 ? 12 : i % 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        options.push({ value: hour, label: `${displayHour}:00 ${ampm}` });
    }
    return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TimeSlotManager = ({ day }) => {
    const { dispatchAvailability } = useTeacher();
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleAddSlot = () => {
        if (startTime !== '' && endTime !== '' && parseInt(endTime) > parseInt(startTime)) {
            dispatchAvailability({
                type: 'ADD_SLOT',
                value: {
                    day,
                    startTime,
                    endTime,
                },
            });
            // Reset fields after adding
            setStartTime('');
            setEndTime('');
        }
    };

    const filteredEndTimeOptions = TIME_OPTIONS.filter(option => 
        startTime === '' || option.value > parseInt(startTime)
    );

    return (
        <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start-time">From</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger id="start-time">
                            <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_OPTIONS.slice(0, -1).map(option => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="end-time">To</Label>
                    <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                        <SelectTrigger id="end-time">
                            <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredEndTimeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button onClick={handleAddSlot} disabled={!startTime || !endTime || parseInt(endTime) <= parseInt(startTime)} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Slot
            </Button>
        </div>
    );
};

export default TimeSlotManager;