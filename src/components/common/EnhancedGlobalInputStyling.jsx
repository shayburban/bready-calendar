
import React, { useState, useEffect } from 'react';
import { Country } from '@/api/entities';

// Utility to merge class names
const mergeClasses = (...classes) => classes.filter(Boolean).join(' ');

// Enhanced styling that matches the dropdown from the screenshot
const getDropdownMatchingClasses = () => {
  // Based on the screenshot, the dropdown has a light gray background and consistent sizing
  return 'bg-gray-50 border border-gray-300 text-gray-700 rounded-md px-3 py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150';
};

const getVariantClasses = (variant) => {
  const baseClasses = getDropdownMatchingClasses();
  
  switch (variant) {
    case 'outline':
      return `${baseClasses} bg-transparent border-gray-300`;
    case 'filled':
      return `${baseClasses} bg-gray-100 border-transparent hover:border-gray-300`;
    case 'dropdown-match':
      return baseClasses; // Exact match to dropdown styling
    case 'default':
    default:
      return baseClasses;
  }
};

// Enhanced Input Component with Dropdown Matching
export const EnhancedInput = React.forwardRef(({ 
  variant = 'dropdown-match', 
  error = false, 
  className = '', 
  ...props 
}, ref) => {
  const combinedClassName = mergeClasses(
    getVariantClasses(variant),
    error && 'border-red-500 focus:ring-red-500',
    'disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
  return <input ref={ref} className={combinedClassName} {...props} />;
});
EnhancedInput.displayName = 'EnhancedInput';

// Enhanced Select Component with Left-aligned Arrow
export const EnhancedSelect = React.forwardRef(({ 
  variant = 'dropdown-match', 
  error = false, 
  className = '', 
  children, 
  ...props 
}, ref) => {
  const combinedClassName = mergeClasses(
    getVariantClasses(variant),
    'pl-8 pr-3 appearance-none bg-no-repeat bg-left-3 bg-center', // Arrow on the left
    'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23374151\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")]',
    error && 'border-red-500 focus:ring-red-500',
    'disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
  
  return (
    <select ref={ref} className={combinedClassName} {...props}>
      {children}
    </select>
  );
});
EnhancedSelect.displayName = 'EnhancedSelect';

// Enhanced Textarea Component
export const EnhancedTextarea = React.forwardRef(({ 
  variant = 'dropdown-match', 
  error = false, 
  className = '', 
  ...props 
}, ref) => {
  const combinedClassName = mergeClasses(
    getVariantClasses(variant),
    'resize-vertical min-h-[80px]',
    error && 'border-red-500 focus:ring-red-500',
    'disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
  return <textarea ref={ref} className={combinedClassName} {...props} />;
});
EnhancedTextarea.displayName = 'EnhancedTextarea';

// Country Code Selector Component with Left-aligned Arrow
export const CountryCodeSelector = ({ 
  selectedCountryCode, 
  onCountryCodeChange, 
  className = '',
  error = false 
}) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countryList = await Country.list();
      setCountries(countryList.sort((a, b) => a.country_name.localeCompare(b.country_name)));
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback to basic country list
      setCountries([
        { phone_country_code: '+1', country_name: 'United States', country_code: 'US' },
        { phone_country_code: '+44', country_name: 'United Kingdom', country_code: 'GB' },
        { phone_country_code: '+91', country_name: 'India', country_code: 'IN' },
        { phone_country_code: '+49', country_name: 'Germany', country_code: 'DE' },
        { phone_country_code: '+33', country_name: 'France', country_code: 'FR' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center px-8 py-2.5 bg-gray-50 border border-gray-300 rounded-md">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <EnhancedSelect
        value={selectedCountryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        error={error}
        className={`pl-8 pr-3 ${className}`}
      >
        <option value="">Select Code</option>
        {countries.map((country) => (
          <option key={country.country_code} value={country.phone_country_code}>
            {country.phone_country_code} ({country.country_name})
          </option>
        ))}
      </EnhancedSelect>
    </div>
  );
};

// Phone Number Input with Country Code
export const PhoneNumberInput = ({ 
  countryCode, 
  phoneNumber, 
  onCountryCodeChange, 
  onPhoneNumberChange,
  error = false,
  className = ''
}) => {
  const [phoneError, setPhoneError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (countryCode && countries.length > 0) {
      const country = countries.find(c => c.phone_country_code === countryCode);
      setSelectedCountry(country);
      validatePhoneNumber(phoneNumber, country);
    }
  }, [countryCode, phoneNumber, countries]);

  const loadCountries = async () => {
    try {
      const countryList = await Country.list();
      setCountries(countryList);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const validatePhoneNumber = (number, country) => {
    if (!number || !country) {
      setPhoneError('');
      return;
    }

    const numericOnly = number.replace(/\D/g, '');
    if (numericOnly.length !== country.phone_number_length) {
      setPhoneError(`Phone number must be ${country.phone_number_length} digits for ${country.country_name}`);
    } else {
      setPhoneError('');
    }
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numeric
    onPhoneNumberChange(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex">
        <div className="w-32">
          <CountryCodeSelector
            selectedCountryCode={countryCode}
            onCountryCodeChange={onCountryCodeChange}
            error={error || !!phoneError}
          />
        </div>
        <div className="flex-1 ml-2">
          <EnhancedInput
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            error={error || !!phoneError}
          />
        </div>
      </div>
      {phoneError && (
        <p className="text-red-500 text-sm font-medium">{phoneError}</p>
      )}
      {selectedCountry && (
        <p className="text-gray-500 text-xs">
          Expected length: {selectedCountry.phone_number_length} digits for {selectedCountry.country_name}
        </p>
      )}
    </div>
  );
};

// Timezone Display Component with IP-based detection and hours:minutes format
export const TimezoneDisplay = ({ country, city, className = '' }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [userTimezone, setUserTimezone] = useState('UTC'); // New state for user's timezone

  useEffect(() => {
    // Get user's timezone from browser (IP-based detection)
    const detectedUserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(detectedUserTimezone);
    
    updateTimezoneInfo();
    const interval = setInterval(updateTimezoneInfo, 30000); // Update every 30 seconds instead of 1 second
    return () => clearInterval(interval);
  }, [country, city, userTimezone]); // Added userTimezone to dependencies

  const updateTimezoneInfo = async () => {
    try {
      let targetTimezone = userTimezone; // Default to user's IP-based timezone
      
      if (country && city) {
        // Try to get timezone from country data
        const countries = await Country.list();
        const countryData = countries.find(c => 
          c.country_name.toLowerCase().includes(country.toLowerCase())
        );
        
        if (countryData) {
          // Check if city has specific timezone
          const cityData = countryData.cities?.find(c => 
            c.city_name.toLowerCase() === city.toLowerCase()
          );
          targetTimezone = cityData?.timezone || countryData.timezone;
        }
      }

      setTimezone(targetTimezone);
      
      // Format time as HH:MM only (no seconds)
      const time = new Date().toLocaleString('en-US', {
        timeZone: targetTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      setCurrentTime(time);
    } catch (error) {
      console.error('Error updating timezone:', error);
      // Fallback to simple time format without timezone
      const time = new Date().toLocaleString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(time);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Current Time: {currentTime}
          </span>
          <span className="text-xs text-gray-500">
            {timezone}
          </span>
        </div>
        {(!country || !city) && (
          <p className="text-xs text-gray-400 mt-1">
            Please enter a valid country and city for accurate timezone
          </p>
        )}
      </div>
    </div>
  );
};

// Test Page Component
export const EnhancedInputTestPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    country: '',
    city: '',
    countryCode: '',
    phoneNumber: ''
  });

  // Auto-detect country code based on IP (placeholder - will be implemented in next step)
  useEffect(() => {
    setFormData(prev => ({ ...prev, countryCode: '+1' })); // Default to US
  }, []);

  return (
    <div className="p-8 bg-white font-sans max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enhanced Input System - Dropdown Matching</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <EnhancedInput 
            placeholder="Write your first name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <EnhancedInput 
            type="email"
            placeholder="Write your email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <EnhancedInput 
              placeholder="Enter country"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City  
            </label>
            <EnhancedInput 
              placeholder="Enter city"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone Information
          </label>
          <TimezoneDisplay country={formData.country} city={formData.city} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <PhoneNumberInput
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(code) => setFormData({...formData, countryCode: code})}
            onPhoneNumberChange={(number) => setFormData({...formData, phoneNumber: number})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Language (Reference Dropdown)
          </label>
          <EnhancedSelect>
            <option>Select Language</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </EnhancedSelect>
        </div>
      </div>
    </div>
  );
};
