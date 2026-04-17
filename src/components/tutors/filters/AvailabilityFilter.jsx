import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function AvailabilityFilter() {
    const availabilityOptions = [
        "Available Today",
        "Available This Week", 
        "Available This Month",
        "Flexible Schedule",
        "Weekend Only",
        "Weekday Only",
        "Morning (6 AM - 12 PM)",
        "Afternoon (12 PM - 6 PM)",
        "Evening (6 PM - 12 AM)"
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {availabilityOptions.map((option, index) => (
                    <div key={option} className="flex items-center space-x-2">
                        <Checkbox id={`avail-${index}`} />
                        <label
                          htmlFor={`avail-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option}
                        </label>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2">
                <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">View More</Button>
                <Button variant="ghost" size="sm" className="text-gray-500">Reset</Button>
            </div>
        </div>
    );
}