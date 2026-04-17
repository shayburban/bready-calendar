import React from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const SearchBar = ({ state, dispatch }) => {
    const handleSearchChange = (e) => {
        dispatch({
            type: actionTypes.SET_SEARCH_QUERY,
            payload: e.target.value
        });
    };

    return (
        <div className="relative mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                    type="text"
                    placeholder="Search for teachers, subjects, or specializations..."
                    value={state.searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 h-12 text-lg"
                />
            </div>
        </div>
    );
};

export default SearchBar;