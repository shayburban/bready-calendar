import React, { useState, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import useOnClickOutside from '@/components/hooks/useOnClickOutside';

const SearchableDropdownField = ({ 
  options, 
  selectedValue, 
  onSelect, 
  placeholder = "Select an option", 
  loading = false,
  searchPlaceholder = "Search...",
  searchType = "startsWith" // "startsWith" or "contains"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  // Helper function to extract searchable text from any label format
  const normalizeLabel = (label) => {
    // For formats like "+1 (United States)", extract "United States"
    const match = label.match(/\(([^)]+)\)/);
    // Otherwise, use the label as is
    return match ? match[1].toLowerCase() : label.toLowerCase();
  };

  // 1. Remove duplicates from the options array using a Map.
  // 2. Filter based on the search term and the normalized label.
  const filteredOptions = [...new Map(options.map(opt => [opt.label, opt])).values()]
    .filter(option => {
      if (!searchTerm) return true; // Show all options if search is empty

      const searchText = searchTerm.toLowerCase().trim();
      const normalized = normalizeLabel(option.label);

      return searchType === "startsWith"
        ? normalized.startsWith(searchText)
        : normalized.includes(searchText);
    });

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="bg-gray-50 border border-gray-300 text-gray-700 rounded-md px-3 py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center disabled:bg-gray-200 disabled:cursor-wait"
      >
        <span className="truncate text-left">{loading ? 'Loading...' : displayLabel}</span>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="py-1 max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedValue === option.value ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-900'}`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdownField;