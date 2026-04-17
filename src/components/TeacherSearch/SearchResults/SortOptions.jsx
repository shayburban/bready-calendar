import React from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SortOptions = ({ state, dispatch }) => {
    const handleSortChange = (value) => {
        dispatch({
            type: actionTypes.SET_SORT_BY,
            payload: value
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm font-medium">Sort by:</Label>
            <Select value={state.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger id="sort-by" className="w-[180px]">
                    <SelectValue placeholder="Sort results" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Relevance</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating_desc">Rating: High to Low</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default SortOptions;