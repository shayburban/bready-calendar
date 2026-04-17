import React, { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Check, Search } from 'lucide-react';

const CountryTabSelector = ({ 
    availableCountries = [], 
    selectedCountry = null,
    onCountryChange,
    completedCountries = [], 
    maxVisible = 4,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [countryOrder, setCountryOrder] = useState(availableCountries);
    const [isHovering, setIsHovering] = useState(false);
    const orderRef = useRef(availableCountries);
    const hoverTimeoutRef = useRef(null);

    // Update order reference when availableCountries changes
    React.useEffect(() => {
        if (countryOrder.length === 0) {
            setCountryOrder(availableCountries);
            orderRef.current = availableCountries;
        }
    }, [availableCountries, countryOrder.length]);

    // Filter countries based on search term
    const filteredOverflowCountries = useMemo(() => {
        const overflowCountries = countryOrder.slice(maxVisible);
        if (!searchTerm) return overflowCountries;
        
        return overflowCountries.filter(country =>
            country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [countryOrder, maxVisible, searchTerm]);

    const visibleCountries = countryOrder.slice(0, maxVisible);
    const hasOverflow = countryOrder.length > maxVisible;

    const handleCountrySelect = (country, isFromDropdown = false) => {
        onCountryChange(country);
        setIsOpen(false);
        setSearchTerm(''); // Clear search when selecting

        // Only reorder if selected from dropdown (not from visible buttons)
        if (isFromDropdown) {
            const newOrder = [country, ...countryOrder.filter(c => c.code !== country.code)];
            setCountryOrder(newOrder);
            orderRef.current = newOrder;
        }
    };

    const isCountryCompleted = (country) => {
        return completedCountries.some(c => c.code === country.code);
    };

    // Enhanced hover handling for smooth interactions
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setIsHovering(true);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        hoverTimeoutRef.current = setTimeout(() => {
            if (!isHovering) {
                setIsOpen(false);
            }
        }, 150); // Small delay to allow moving to dropdown
    };

    const handleDropdownMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setIsHovering(true);
    };

    const handleDropdownMouseLeave = () => {
        setIsHovering(false);
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 150);
    };

    const CountryButton = ({ country, isInDropdown = false, onClick }) => {
        const isSelected = selectedCountry?.code === country.code;
        const isCompleted = isCountryCompleted(country);
        
        return (
            <button
                onClick={onClick}
                className={`
                    relative px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap
                    ${isSelected 
                        ? 'text-blue-600 bg-transparent' 
                        : 'text-gray-600 bg-transparent hover:text-gray-800 hover:bg-gray-50'
                    }
                    ${isInDropdown ? 'w-full justify-between rounded-md' : 'rounded-none'}
                `}
                style={isSelected && !isInDropdown ? { 
                    borderBottom: '2px solid #3b82f6',
                    paddingBottom: '6px'
                } : {}}
            >
                <span>{country.name}</span>
                {isCompleted && (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
            </button>
        );
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Country Tab Buttons */}
            <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                {/* Visible countries */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {visibleCountries.map((country) => (
                        <CountryButton 
                            key={country.code} 
                            country={country} 
                            onClick={() => handleCountrySelect(country, false)}
                        />
                    ))}
                </div>

                {/* Overflow dropdown */}
                {hasOverflow && (
                    <div className="flex-shrink-0">
                        <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-auto min-h-0 text-xs px-3 py-2 border-dashed whitespace-nowrap"
                                    style={{
                                        background: 'var(--color-dropdown-bg)',
                                        border: 'solid 1px var(--color-dropdown-border)',
                                        color: 'var(--color-dropdown-text)',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    +{countryOrder.length - maxVisible} More
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-72 p-0" 
                                align="end"
                                sideOffset={5}
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onMouseEnter={handleDropdownMouseEnter}
                                onMouseLeave={handleDropdownMouseLeave}
                            >
                                {/* Search header */}
                                <div className="p-3 border-b bg-gray-50">
                                    <h4 className="font-semibold text-sm text-gray-900 mb-2">More Countries</h4>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search countries..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 h-8 text-sm"
                                            style={{
                                                background: 'var(--color-dropdown-bg)',
                                                border: 'solid 1px var(--color-dropdown-border)',
                                                color: 'var(--color-dropdown-text)'
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Scrollable countries list */}
                                <div className="max-h-48 overflow-y-auto">
                                    {filteredOverflowCountries.length > 0 ? (
                                        <div className="p-2 space-y-1">
                                            {filteredOverflowCountries.map((country) => (
                                                <CountryButton 
                                                    key={country.code} 
                                                    country={country} 
                                                    isInDropdown={true}
                                                    onClick={() => handleCountrySelect(country, true)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            No countries found matching "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
            </div>

            {/* Selected country description */}
            {selectedCountry && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-1">
                        Educational Systems in {selectedCountry.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                        Specialized courses and exams available in {selectedCountry.name}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CountryTabSelector;