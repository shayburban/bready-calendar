import React from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

const PriceRangeFilter = ({ state, dispatch }) => {
    const { filters } = state;
    const { priceRange } = filters;

    const handlePriceChange = (value) => {
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'priceRange', value: { min: value[0], max: value[1] } }
        });
    };

    return (
        <AccordionItem value="price">
            <AccordionTrigger className="text-sm font-medium">
                Price Range (${priceRange.min} - ${priceRange.max})
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4">
                    <Slider
                        value={[priceRange.min, priceRange.max]}
                        onValueChange={handlePriceChange}
                        max={1000}
                        min={0}
                        step={5}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>$0</span>
                        <span>$1000</span>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default PriceRangeFilter;