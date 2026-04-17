import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ReviewsFilter() {
    const reviewOptions = [
        { label: "100+ Reviews", count: 23 },
        { label: "50+ Reviews", count: 67 },
        { label: "25+ Reviews", count: 134 },
        { label: "10+ Reviews", count: 289 },
        { label: "5+ Reviews", count: 445 }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {reviewOptions.map((option, index) => (
                    <div key={option.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`review-${index}`} />
                            <label
                              htmlFor={`review-${index}`}
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