import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ExperienceFilter() {
    const experienceOptions = [
        { label: "10+ Years", count: 45 },
        { label: "5-10 Years", count: 123 },
        { label: "3-5 Years", count: 187 },
        { label: "1-3 Years", count: 234 },
        { label: "Less than 1 Year", count: 89 }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {experienceOptions.map((option, index) => (
                    <div key={option.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`exp-${index}`} />
                            <label
                              htmlFor={`exp-${index}`}
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