import React, { useReducer, useEffect } from 'react';
import { searchReducer, initialState, actionTypes } from '@/components/teacherSearch/searchReducer';
import FilterPanel from './Filters/FilterPanel';
import ResultsGrid from './SearchResults/ResultsGrid';
import SearchBar from './SearchBar/SearchBar';
import ActiveFiltersDisplay from './Filters/ActiveFiltersDisplay';

const SearchContainer = ({ initialTeachers }) => {
    const [state, dispatch] = useReducer(searchReducer, initialState);

    useEffect(() => {
        if (initialTeachers && initialTeachers.length > 0) {
            dispatch({ 
                type: actionTypes.INITIALIZE_TEACHERS, 
                payload: initialTeachers 
            });
        }
    }, [initialTeachers]);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Column */}
            <aside className="w-full lg:w-1/4 xl:w-1/5">
                <FilterPanel state={state} dispatch={dispatch} />
            </aside>

            {/* Results Column */}
            <main className="w-full lg:w-3/4 xl:w-4/5">
                <SearchBar state={state} dispatch={dispatch} />
                <ActiveFiltersDisplay state={state} dispatch={dispatch} />
                <ResultsGrid state={state} dispatch={dispatch} />
            </main>
        </div>
    );
};

export default SearchContainer;