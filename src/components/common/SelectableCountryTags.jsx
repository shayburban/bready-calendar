import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';

const SelectableCountryTags = ({ 
    availableCountries = [], 
    selectedCountries = [], 
    onSelectionChange,
    maxVisible = 4,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Split countries into visible and overflow
    const visibleCountries = selectedCountries.slice(0, maxVisible);
    const overflowCountries = selectedCountries.slice(maxVisible);
    const hasOverflow = overflowCountries.length > 0;

    const handleCountryToggle = (country) => {
        const isSelected = selectedCountries.some(c => c.code === country.code);
        let newSelection;
        
        if (isSelected) {
            newSelection = selectedCountries.filter(c => c.code !== country.code);
        } else {
            newSelection = [...selectedCountries, country];
        }
        
        onSelectionChange(newSelection);
    };

    const isCountrySelected = (country) => {
        return selectedCountries.some(c => c.code === country.code);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Selected Countries Display */}
            {selectedCountries.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Visible selected countries */}
                    {visibleCountries.map((country) => (
                        <button
                            key={country.code}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors border-b-2 border-b-blue-600"
                            style={{ borderBottomColor: '#3b82f6', borderBottomWidth: '2px' }}
                        >
                            {country.name}
                        </button>
                    ))}

                    {/* Overflow display */}
                    {hasOverflow && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-auto min-h-0 text-xs px-2 py-1 border-dashed"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.click();
                                    }}
                                >
                                    +{overflowCountries.length} More
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="start">
                                <div className="p-3 border-b">
                                    <h4 className="font-semibold text-sm text-gray-900">Additional Countries</h4>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-3">
                                    <div className="space-y-2">
                                        {overflowCountries.map((country) => (
                                            <div
                                                key={country.code}
                                                className="flex items-center justify-between p-2 border rounded-md bg-blue-50 text-xs"
                                            >
                                                <span className="font-medium text-blue-600">
                                                    {country.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            )}

            {/* Country Selection Dropdown */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                    >
                        Select Countries
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 border-b">
                        <h4 className="font-semibold text-gray-900">Select Countries/Regions</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Choose countries where you can teach courses and exams
                        </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-3">
                        <div className="space-y-2">
                            {availableCountries.map((country) => {
                                const selected = isCountrySelected(country);
                                return (
                                    <button
                                        key={country.code}
                                        onClick={() => handleCountryToggle(country)}
                                        className={`w-full text-left p-2 rounded-md border transition-colors ${
                                            selected 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">
                                                {country.name}
                                            </span>
                                            {selected && (
                                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        {country.description && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {country.description}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default SelectableCountryTags;