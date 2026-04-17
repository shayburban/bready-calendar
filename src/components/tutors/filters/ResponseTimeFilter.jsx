import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ResponseTimeFilter() {
    const responseOptions = [
        { label: "Within 1 Hour", count: 67 },
        { label: "Within 4 Hours", count: 134 },
        { label: "Within 12 Hours", count: 201 },
        { label: "Within 24 Hours", count: 289 },
        { label: "Within 48 Hours", count: 345 }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {responseOptions.map((option, index) => (
                    <div key={option.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`response-${index}`} />
                            <label
                              htmlFor={`response-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                        </div>
                        <span className="text-xs text-gray-500">({option.count})</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" className="text-gray-500">Reset</Button>
            </div>
        </div>
    );
}