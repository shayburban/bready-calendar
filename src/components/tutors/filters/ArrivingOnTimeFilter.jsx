import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ArrivingOnTimeFilter() {
    const punctualityOptions = [
        { label: "Always On Time (95%+)", count: 89 },
        { label: "Usually On Time (85%+)", count: 156 },
        { label: "Often On Time (75%+)", count: 201 },
        { label: "Sometimes On Time (65%+)", count: 134 }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {punctualityOptions.map((option, index) => (
                    <div key={option.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`punctuality-${index}`} />
                            <label
                              htmlFor={`punctuality-${index}`}
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