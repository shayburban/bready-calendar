
import React, { useState, useEffect } from 'react';
import { Country } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import SearchableDropdownField from './SearchableDropdownField';
import CustomCityInput from './CustomCityInput';
import { useIPCountryDetection } from '@/components/common/IPCountryDetection';

export const DynamicTimezone = () => {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [displayedTimezone, setDisplayedTimezone] = useState(null);
  const [localTimeDisplay, setLocalTimeDisplay] = useState('Select a country to see the timezone.');
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isMultiTimezone, setIsMultiTimezone] = useState(false);
  const [isTimezoneConfirmed, setIsTimezoneConfirmed] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false); // New state to track custom city submission
  const { detectedCountry, loading: ipLoading } = useIPCountryDetection();
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const countries = await Country.list();
        const options = countries.map(c => ({
          label: c.country_name,
          value: c.country_name,
          countryData: c,
        })).sort((a, b) => a.label.localeCompare(b.label));
        setCountryOptions(options);
      } catch (error) {
        console.error("Failed to load countries for timezone check", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Effect to calculate and format the time display whenever the timezone changes
  useEffect(() => {
    if (displayedTimezone) {
      try {
        // Use 'en-GB' locale and hour12: false for 24-hour format
        const timeString = new Date().toLocaleTimeString('en-GB', {
          timeZone: displayedTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        setLocalTimeDisplay(`${timeString} (${displayedTimezone})`);
      } catch (e) {
        setLocalTimeDisplay(`Invalid Timezone: ${displayedTimezone}`);
      }
    } else {
      setLocalTimeDisplay('Select a country to see the timezone.');
    }
  }, [displayedTimezone]);

      useEffect(() => {
        if (ipLoading) return;
        
        // Auto-fill phoneCountryCode if detected and not already set
        if (detectedCountry && detectedCountry.country_name) {
          setCountryName(detectedCountry.country_name)
        }
        
    }, [detectedCountry, ipLoading]);


  const handleCountrySelect = (option) => {
    setCountry(option.value);
    const countryData = option.countryData;
    const hasMultipleTimezones = countryData.cities && countryData.cities.length > 0;

    setCity('');
    setIsCustomCity(false); // Reset custom city flag
    setCityOptions(
      hasMultipleTimezones
        ? countryData.cities.map(c => ({
            label: c.city_name,
            value: c.city_name,
            timezone: c.timezone,
          })).sort((a, b) => a.label.localeCompare(b.label))
        : []
    );
    setDisplayedTimezone(countryData.timezone);
    setIsMultiTimezone(hasMultipleTimezones);
    setIsTimezoneConfirmed(!hasMultipleTimezones);
  };

  const handleCitySelect = (option) => {
    setCity(option.value);
    setIsCustomCity(false); // This is a city from the database, not custom
    // Add a defensive check to ensure the city option has a timezone
    // before updating the state. This prevents accidental resets.
    if (option && option.timezone) {
        setDisplayedTimezone(option.timezone);
        setIsTimezoneConfirmed(true); // Cities from DB are always confirmed
    }
  };

  const handleCustomCitySubmit = (customCityName, userTimezone) => {
    setCity(customCityName);
    setIsCustomCity(true); // Mark that a custom city was submitted
    if (isMultiTimezone) {
      setDisplayedTimezone(userTimezone);
      setIsTimezoneConfirmed(false); // It's a custom city, so it needs confirmation
    } else {
      setIsTimezoneConfirmed(true);
    }
  };

  const confirmTimezone = () => {
    setIsTimezoneConfirmed(true);
    alert(`Timezone "${displayedTimezone}" has been confirmed.`);
  };

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <SearchableDropdownField
            options={countryOptions}
            selectedValue={country === "" ? countryName : country}
            onSelect={handleCountrySelect}
            placeholder={"Select Country"}
            searchPlaceholder="Search countries..."
            searchType="startsWith"
            loading={isLoadingCountries}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <CustomCityInput
            cityOptions={cityOptions}
            selectedCity={city}
            onCitySelect={handleCitySelect}
            onCustomCitySubmit={handleCustomCitySubmit}
            countryName={country}
            countryTimezone={displayedTimezone}
            disabled={!country || isLoadingCountries}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700">{localTimeDisplay}</p>
        </div>
        {/* Updated condition: only show for custom cities that need confirmation */}
        {isCustomCity && !isTimezoneConfirmed && isMultiTimezone && (
          <Button
            size="sm"
            onClick={confirmTimezone}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Timezone
          </Button>
        )}
      </div>
    </div>
  );
};
