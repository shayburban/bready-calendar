import React from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ActiveFiltersDisplay = ({ state, dispatch }) => {
    const { filters } = state;

    const clearFilter = (filterType, value = null) => {
        let newValue;
        
        switch (filterType) {
            case 'subjects':
            case 'specializations':
            case 'languages':
                newValue = filters[filterType].filter(item => item !== value);
                break;
            case 'availability':
                const newAvailability = { ...filters.availability };
                delete newAvailability[value];
                newValue = newAvailability;
                break;
            case 'location':
                newValue = '';
                break;
            case 'priceRange':
                newValue = { min: 0, max: 1000 };
                break;
            case 'ratings':
                newValue = { min: 0, max: 5 };
                break;
            default:
                return;
        }

        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType, value: newValue }
        });
    };

    const clearAllFilters = () => {
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { 
                filterType: 'clear_all', 
                value: {
                    subjects: [],
                    specializations: [],
                    availability: {},
                    priceRange: { min: 0, max: 1000 },
                    ratings: { min: 0, max: 5 },
                    location: '',
                    languages: []
                }
            }
        });
    };

    const hasActiveFilters = () => {
        return filters.subjects.length > 0 ||
               filters.specializations.length > 0 ||
               Object.keys(filters.availability).length > 0 ||
               filters.priceRange.min > 0 || filters.priceRange.max < 1000 ||
               filters.ratings.min > 0 ||
               filters.location !== '' ||
               filters.languages.length > 0;
    };

    if (!hasActiveFilters()) {
        return null;
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Active Filters:</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-gray-700"
                >
                    Clear All
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {/* Subject filters */}
                {filters.subjects.map(subject => (
                    <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                        Subject: {subject}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => clearFilter('subjects', subject)}
                        />
                    </Badge>
                ))}

                {/* Specialization filters */}
                {filters.specializations.map(spec => (
                    <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                        Specialization: {spec}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => clearFilter('specializations', spec)}
                        />
                    </Badge>
                ))}

                {/* Availability filters */}
                {Object.keys(filters.availability).map(day => (
                    <Badge key={day} variant="secondary" className="flex items-center gap-1">
                        Available: {day}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => clearFilter('availability', day)}
                        />
                    </Badge>
                ))}

                {/* Location filter */}
                {filters.location && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        Location: {filters.location}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => clearFilter('location')}
                        />
                    </Badge>
                )}

                {/* Language filters */}
                {filters.languages.map(language => (
                    <Badge key={language} variant="secondary" className="flex items-center gap-1">
                        Language: {language}
                        <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => clearFilter('languages', language)}
                        />
                    </Badge>
                ))}
            </div>
        </div>
    );
};

export default ActiveFiltersDisplay;