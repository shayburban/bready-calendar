
import React from 'react';
import { Country } from '@/api/entities';

// TypeScript-style interfaces (simulated for React)
export const API_INTERFACES = {
  Country: {
    country_name: 'string',
    country_code: 'string', 
    phone_country_code: 'string',
    phone_number_length: 'number',
    timezone: 'string',
    cities: 'array',
    currency_code: 'string',
    is_active: 'boolean'
  },
  
  IPLocationResponse: {
    country_code: 'string',
    country_name: 'string', 
    timezone: 'string',
    success: 'boolean'
  },
  
  PhoneValidationRequest: {
    phone_country_code: 'string',
    phone_number: 'string'
  },
  
  TimezoneRequest: {
    country: 'string',
    city: 'string'
  }
};

export const detectUserCountry = async () => {
  try {
    // Try multiple APIs with proper error handling
    const apis = [
      {
        url: 'https://ipapi.co/json/',
        parser: (data) => ({
          country_name: data.country_name,
          country_code: data.country_code?.toUpperCase(),
          timezone: data.timezone || 'UTC'
        })
      },
      {
        url: 'http://ip-api.com/json/',
        parser: (data) => ({
          country_name: data.country,
          country_code: data.countryCode?.toUpperCase(),
          timezone: data.timezone || 'UTC'
        })
      }
    ];

    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const parsed = api.parser(data);
          
          if (parsed.country_name && parsed.country_code) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn(`API ${api.url} failed:`, error.message);
        continue; // Try next API
      }
    }

    // If all APIs fail, use browser timezone as fallback
    return getBrowserBasedCountry();
    
  } catch (error) {
    console.error('Country detection completely failed:', error);
    return getBrowserBasedCountry();
  }
};

const getBrowserBasedCountry = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to countries
    const timezoneMap = {
      'America/New_York': { country_name: 'United States', country_code: 'US' },
      'America/Los_Angeles': { country_name: 'United States', country_code: 'US' },
      'America/Chicago': { country_name: 'United States', country_code: 'US' },
      'Europe/London': { country_name: 'United Kingdom', country_code: 'GB' },
      'Europe/Berlin': { country_name: 'Germany', country_code: 'DE' },
      'Europe/Paris': { country_name: 'France', country_code: 'FR' },
      'Asia/Tokyo': { country_name: 'Japan', country_code: 'JP' },
      'Asia/Shanghai': { country_name: 'China', country_code: 'CN' },
      'Asia/Kolkata': { country_name: 'India', country_code: 'IN' },
      'Asia/Dubai': { country_name: 'United Arab Emirates', country_code: 'AE' },
      'Australia/Sydney': { country_name: 'Australia', country_code: 'AU' },
      'Australia/Melbourne': { country_name: 'Australia', country_code: 'AU' },
      'Africa/Cairo': { country_name: 'Egypt', country_code: 'EG' },
      'Africa/Johannesburg': { country_name: 'South Africa', country_code: 'ZA' },
      'America/Sao_Paulo': { country_name: 'Brazil', country_code: 'BR' },
      'America/Mexico_City': { country_name: 'Mexico', country_code: 'MX' }
    };

    const detected = timezoneMap[timezone];
    if (detected) {
      return {
        ...detected,
        timezone: timezone
      };
    }

    // Extract continent/region from timezone for basic fallback
    if (timezone.startsWith('America/')) {
      return { country_name: 'United States', country_code: 'US', timezone };
    } else if (timezone.startsWith('Europe/')) {
      return { country_name: 'United Kingdom', country_code: 'GB', timezone };
    } else if (timezone.startsWith('Asia/')) {
      return { country_name: 'India', country_code: 'IN', timezone };
    } else if (timezone.startsWith('Africa/')) {
        return { country_name: 'South Africa', country_code: 'ZA', timezone };
    } else if (timezone.startsWith('Australia/')) {
        return { country_name: 'Australia', country_code: 'AU', timezone };
    }

  } catch (error) {
    console.warn('Browser timezone detection failed:', error);
  }

  // Ultimate fallback
  return {
    country_name: 'United States',
    country_code: 'US',
    timezone: 'America/New_York'
  };
};

// Advanced Phone & IP Detection System (Step 2 Implementation)
export const CountryAPIService = {
  // Mock Express.js API endpoint: /api/ip-to-country
  async getCountryFromIP(ipAddress = null) {
    try {
      // In a real MERN app, this would call your Express.js backend
      // which would use GeoIP2 or ip-api.com
      
      // Mock IP detection response 
      const mockResponse = {
        country_code: 'US',
        country_name: 'United States',
        phone_country_code: '+1',
        timezone: 'America/New_York',
        success: true,
        detected_via: 'ip-api.com', // Would be real service
        ip_address: ipAddress || '192.168.1.1' // Mock IP
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return mockResponse;
    } catch (error) {
      console.error('IP to country detection failed:', error);
      return {
        country_code: 'US', // Default fallback
        country_name: 'United States', 
        phone_country_code: '+1',
        timezone: 'America/New_York',
        success: false,
        error: 'IP detection failed'
      };
    }
  },

  // Mock Express.js API endpoint: /api/countries
  async getAllCountries() {
    try {
      const countries = await Country.list();
      
      // Remove duplicates by phone_country_code
      const uniqueCountries = countries.reduce((acc, country) => {
        const existing = acc.find(c => c.phone_country_code === country.phone_country_code);
        if (!existing) {
          acc.push(country);
        }
        return acc;
      }, []);

      return {
        success: true,
        data: uniqueCountries.sort((a, b) => a.country_name.localeCompare(b.country_name)),
        total: uniqueCountries.length
      };
    } catch (error) {
      console.error('Error fetching countries:', error);
      return {
        success: false,
        error: 'Failed to fetch countries',
        data: []
      };
    }
  },

  // Mock Express.js API endpoint: /api/phone-validation
  async validatePhoneNumber(phoneCountryCode, phoneNumber) {
    try {
      // Get country-specific validation rules
      const countries = await Country.filter({ phone_country_code: phoneCountryCode });
      
      if (!countries || countries.length === 0) {
        return {
          success: false,
          valid: false,
          error: 'Country code not found',
          required_length: null
        };
      }

      const country = countries[0];
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const isValid = cleanNumber.length === country.phone_number_length;

      return {
        success: true,
        valid: isValid,
        country_name: country.country_name,
        required_length: country.phone_number_length,
        current_length: cleanNumber.length,
        error: isValid ? null : `Phone number must be ${country.phone_number_length} digits for ${country.country_name}`
      };

    } catch (error) {
      console.error('Phone validation error:', error);
      return {
        success: false,
        valid: false,
        error: 'Validation service unavailable'
      };
    }
  },

  // Mock Express.js API endpoint: /api/timezone 
  async getTimezoneByLocation(country, city = null) {
    try {
      let query = { country_name: { $regex: new RegExp(country, 'i') } };
      const countries = await Country.filter(query);
      
      if (!countries || countries.length === 0) {
        return {
          success: false,
          error: 'Country not found',
          timezone: 'UTC'
        };
      }

      const matchedCountry = countries[0];
      let timezone = matchedCountry.timezone;

      // If city is provided, try to find city-specific timezone
      if (city && matchedCountry.cities) {
        const matchedCity = matchedCountry.cities.find(c => 
          c.city_name.toLowerCase().includes(city.toLowerCase())
        );
        
        if (matchedCity && matchedCity.timezone) {
          timezone = matchedCity.timezone;
        }
      }

      return {
        success: true,
        timezone,
        country_name: matchedCountry.country_name,
        city_name: city,
        formatted_time: new Date().toLocaleString('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
      };

    } catch (error) {
      console.error('Timezone lookup error:', error);
      return {
        success: false,
        error: 'Timezone service unavailable',
        timezone: 'UTC'
      };
    }
  }
};

// Hook for IP-based country detection with real API integration
export const useAdvancedIPDetection = () => {
  const [detectedCountry, setDetectedCountry] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const detect = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        let primaryDetectionResult = await detectUserCountry(); // { country_name, country_code, timezone }
        let finalDetectedCountryData = null;

        if (primaryDetectionResult && primaryDetectionResult.country_code) {
          // Attempt to enrich data from the Country entity using the detected country_code
          const countryEntities = await Country.filter({ country_code: primaryDetectionResult.country_code });
          
          if (countryEntities && countryEntities.length > 0) {
            const matchedEntity = countryEntities[0];
            finalDetectedCountryData = {
              country_code: primaryDetectionResult.country_code,
              country_name: primaryDetectionResult.country_name,
              // Prioritize detected timezone, fallback to DB
              timezone: primaryDetectionResult.timezone || matchedEntity.timezone,
              phone_country_code: matchedEntity.phone_country_code,
              phone_number_length: matchedEntity.phone_number_length,
              success: true,
              detected_via: 'API_and_DB'
            };
          } else {
            // If country code detected but no matching entity in DB, use raw detection + sensible defaults
            finalDetectedCountryData = {
              country_code: primaryDetectionResult.country_code,
              country_name: primaryDetectionResult.country_name,
              timezone: primaryDetectionResult.timezone,
              phone_country_code: '+1', // Default if not found in DB
              phone_number_length: 10, // Default if not found in DB
              success: true,
              detected_via: 'API_only'
            };
          }
        } else {
          // Fallback to browser-based detection if primary API detection fails or returns no country code
          setError('API country detection failed, falling back to browser timezone.');
          const browserFallbackResult = getBrowserBasedCountry(); // { country_name, country_code, timezone }
          const countryEntities = await Country.filter({ country_code: browserFallbackResult.country_code });

          if (countryEntities && countryEntities.length > 0) {
            const matchedEntity = countryEntities[0];
            finalDetectedCountryData = {
              country_code: browserFallbackResult.country_code,
              country_name: browserFallbackResult.country_name,
              // Prioritize browser timezone, fallback to DB
              timezone: browserFallbackResult.timezone || matchedEntity.timezone,
              phone_country_code: matchedEntity.phone_country_code,
              phone_number_length: matchedEntity.phone_number_length,
              success: false, // Indicate it's a fallback
              detected_via: 'Browser_and_DB'
            };
          } else {
            // Ultimate fallback if even browser detection doesn't match an entity
            finalDetectedCountryData = {
              country_code: browserFallbackResult.country_code,
              country_name: browserFallbackResult.country_name,
              timezone: browserFallbackResult.timezone,
              phone_country_code: '+1', // Absolute default
              phone_number_length: 10, // Absolute default
              success: false,
              detected_via: 'Browser_only'
            };
          }
        }
        setDetectedCountry(finalDetectedCountryData);

      } catch (err) {
        console.error('Advanced IP detection process failed:', err);
        setError('An unexpected error occurred during country detection.');
        // Ensure a fallback state even on unexpected errors
        const ultimateFallback = {
          country_code: 'US',
          country_name: 'United States',
          phone_country_code: '+1',
          timezone: 'America/New_York',
          phone_number_length: 10,
          success: false,
          detected_via: 'Error_Fallback'
        };
        setDetectedCountry(ultimateFallback);
      } finally {
        setLoading(false);
      }
    };

    detect();
  }, []); // Empty dependency array means this runs once on mount

  return { detectedCountry, loading, error };
};
