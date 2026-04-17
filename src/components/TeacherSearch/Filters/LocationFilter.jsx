import React from 'react';
import { actionTypes } from '@/components/TeacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { MapPin } from 'lucide-react';

const LocationFilter = ({ state, dispatch }) => {
    const { filters } = state;

    const handleLocationChange = (e) => {
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'location', value: e.target.value }
        });
    };

    return (
        <AccordionItem value="location">
            <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <Input
                    type="text"
                    placeholder="Search by location..."
                    value={filters.location}
                    onChange={handleLocationChange}
                    className="w-full"
                />
            </AccordionContent>
        </AccordionItem>
    );
};

export default LocationFilter;