import React from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AvailabilityFilter = ({ state, dispatch }) => {
    const { filters } = state;

    const handleDayChange = (day, checked) => {
        const newAvailability = { ...filters.availability };
        
        if (checked) {
            newAvailability[day] = true;
        } else {
            delete newAvailability[day];
        }
        
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'availability', value: newAvailability }
        });
    };

    const selectedDaysCount = Object.keys(filters.availability).length;

    return (
        <AccordionItem value="availability">
            <AccordionTrigger className="text-sm font-medium">
                Availability ({selectedDaysCount})
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                                id={`day-${day}`}
                                checked={filters.availability[day] || false}
                                onCheckedChange={(checked) => handleDayChange(day, checked)}
                            />
                            <Label htmlFor={`day-${day}`} className="text-sm">
                                {day}
                            </Label>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default AvailabilityFilter;