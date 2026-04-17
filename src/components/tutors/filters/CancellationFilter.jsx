import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function CancellationFilter() {
    const cancellationOptions = [
        "Free Cancellation (24h+)",
        "50% Refund (12h+)", 
        "70% Refund (48h+)",
        "90% Refund (1 week+)",
        "Full Refund (3 days+)",
        "No Cancellation Fee",
        "Flexible Policy"
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {cancellationOptions.map((option, index) => (
                    <div key={option} className="flex items-center space-x-2">
                        <Checkbox id={`cancel-${index}`} />
                        <label
                          htmlFor={`cancel-${index}`}
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