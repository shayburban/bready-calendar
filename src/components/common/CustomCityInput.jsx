
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingCity } from '@/api/entities';
import { User } from '@/api/entities';
import useOnClickOutside from '@/components/hooks/useOnClickOutside';

const CustomCityInput = ({
  cityOptions,
  selectedCity,
  onCitySelect,
  onCustomCitySubmit, // New handler from parent
  countryName,
  countryTimezone,
  disabled,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customCityName, setCustomCityName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCities, setPendingCities] = useState([]);
  const [user, setUser] = useState(null);

  const dropdownRef = useRef(null);
  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser) {
          const userPending = await PendingCity.filter({
            teacher_id: currentUser.id,
            status: 'pending'
          });
          setPendingCities(userPending);
        }
      } catch (error) {
        console.error("Failed to fetch user or pending cities:", error);
      }
    };
    fetchUserData();
  }, []);

  const filteredOptions = cityOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onCitySelect(option); // This now calls the parent's handler
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSubmitCustomCity = async () => {
    if (!customCityName.trim() || !user) {
      alert("City name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    const normalizedCustomCity = customCityName.trim().toLowerCase();

    const cityExists =
      cityOptions.some(opt => opt.label.toLowerCase() === normalizedCustomCity) ||
      pendingCities.some(p => p.city_name.toLowerCase() === normalizedCustomCity);

    if (cityExists) {
      alert("This city is already in the list or pending approval.");
      setIsSubmitting(false);
      return;
    }
    
    // Determine timezone for the new city with null check
    const userBrowserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneToSubmit = (countryTimezone && countryTimezone.includes('/')) 
      ? countryTimezone 
      : userBrowserTimezone;

    try {
      const newPendingCity = await PendingCity.create({
        teacher_id: user.id,
        country_name: countryName,
        city_name: customCityName.trim(),
        timezone: timezoneToSubmit,
        status: 'pending',
        teacher_name: user.full_name,
        teacher_email: user.email,
      });

      setPendingCities([...pendingCities, newPendingCity]);
      onCustomCitySubmit(customCityName.trim(), userBrowserTimezone);
      alert(`City "${customCityName.trim()}" submitted for approval.`);
      setCustomCityName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit custom city:', error);
      alert('An error occurred while submitting your city.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayLabel = selectedCity || 'Select or type city';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="bg-gray-50 border border-gray-300 text-gray-700 rounded-md px-3 py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center disabled:bg-gray-20 disabled:text-gray-200"
      >
        <span className="truncate text-left">{loading ? 'Loading...' : displayLabel}</span>
        <ChevronDown className={`h-5 w-5 ${disabled ? `text-gray-200` : `text-gray-500`} transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}` } />
      </button>

      {isOpen && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search for a city..."
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
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500 italic">
                {searchTerm ? `City "${searchTerm}" not found` : "No cities listed for this country"}
              </li>
            )}
            
            {/* Always-visible custom city input form */}
            <li className="p-2 border-t border-gray-200 mt-1">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Can’t find your city? Add it:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter city name"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={customCityName}
                    onChange={(e) => setCustomCityName(e.target.value)}
                  />
                  <Button
                    onClick={handleSubmitCustomCity}
                    disabled={!customCityName.trim() || isSubmitting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? '...' : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomCityInput;
