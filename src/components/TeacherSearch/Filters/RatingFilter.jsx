import React from 'react';
import { actionTypes } from '@/components/TeacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Star } from 'lucide-react';

const RatingFilter = ({ state, dispatch }) => {
    const { filters } = state;
    const { ratings } = filters;

    const handleRatingChange = (value) => {
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'ratings', value: { min: value[0], max: 5 } }
        });
    };

    return (
        <AccordionItem value="rating">
            <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    Minimum Rating ({ratings.min}+)
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4">
                    <Slider
                        value={[ratings.min]}
                        onValueChange={handleRatingChange}
                        max={5}
                        min={0}
                        step={0.5}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0 stars</span>
                        <span>5 stars</span>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default RatingFilter;