import React from 'react';
import { Accordion } from "@/components/ui/accordion";
import SubjectFilter from './SubjectFilter';
import SpecializationFilter from './SpecializationFilter';
import AvailabilityFilter from './AvailabilityFilter';
import PriceRangeFilter from './PriceRangeFilter';
import RatingFilter from './RatingFilter';
import LocationFilter from './LocationFilter';
import LanguageFilter from './LanguageFilter';

const FilterPanel = ({ state, dispatch }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-bold mb-4">Filters</h3>
            <Accordion type="multiple" collapsible className="w-full">
                <SubjectFilter state={state} dispatch={dispatch} />
                <SpecializationFilter state={state} dispatch={dispatch} />
                <AvailabilityFilter state={state} dispatch={dispatch} />
                <PriceRangeFilter state={state} dispatch={dispatch} />
                <RatingFilter state={state} dispatch={dispatch} />
                <LocationFilter state={state} dispatch={dispatch} />
                <LanguageFilter state={state} dispatch={dispatch} />
            </Accordion>
        </div>
    );
};

export default FilterPanel;