
import React, { useState, useEffect, useRef } from 'react';
import { Country } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { CountryDataService } from './CountryDuplicationPrevention'; // New import

// Utility to merge class names
const mergeClasses = (...classes) => classes.filter(Boolean).join(' ');

// Enhanced Input Component
const EnhancedInput = React.forwardRef(({
  variant = 'dropdown-match',
  error = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'bg-gray-50 border border-gray-300 text-gray-700 rounded-md px-3 py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150';

  const combinedClassName = mergeClasses(
    baseClasses,
    error && 'border-red-500 focus:ring-red-500',
    'disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    className
  );
  return <input ref={ref} className={combinedClassName} {...props} />;
});
EnhancedInput.displayName = 'EnhancedInput';

// IP Country Detection Hook
export const useIPCountryDetection = () => {
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountryFromIP = async () => {
      let finalCountryData = null; // To hold the {country_name, country_code, phone_country_code}
      try {
        let ipCountryCode = null; // ISO 2-letter country code (e.g., 'US')
        let ipCountryName = null; // Full country name (e.g., 'United States')

        // First try: ipapi.co (free tier)
        try {
          const res = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(5000), // timeout option using AbortSignal
            headers: {
              'Accept': 'application/json',
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (data.country_name && data.country_code) {
              ipCountryCode = data.country_code.toUpperCase();
              ipCountryName = data.country_name;
              console.log('Detected via ipapi.co:', ipCountryName, ipCountryCode);
            }
          }
        } catch (error) {
          console.warn('ipapi.co failed, trying fallback...', error);
        }

        // Second try: ip-api.com (free tier) if first failed
        if (!ipCountryCode) {
          try {
            const res = await fetch('http://ip-api.com/json/', {
              signal: AbortSignal.timeout(5000),
              headers: {
                'Accept': 'application/json',
              }
            });

            if (res.ok) {
              const data = await res.json();
              // Check if status is 'success' for ip-api.com
              if (data.status === 'success' && data.country && data.countryCode) {
                ipCountryCode = data.countryCode.toUpperCase();
                ipCountryName = data.country;
                console.log('Detected via ip-api.com:', ipCountryName, ipCountryCode);
              } else {
                console.warn('ip-api.com response not successful or missing data:', data);
              }
            }
          } catch (error) {
            console.warn('ip-api.com failed, trying final fallback...', error);
          }
        }

        let phoneCountryCode = '+1'; // Default phone country code
        // Try to derive phone_country_code from the detected ipCountryCode
        if (ipCountryCode) {
          try {
            // Assuming Country.filter can take country_code and return data including phone_country_code
            const countries = await Country.filter({ country_code: ipCountryCode });
            if (countries && countries.length > 0) {
              phoneCountryCode = countries[0].phone_country_code;
              console.log(`Mapped ${ipCountryCode} to phone code ${phoneCountryCode}`);
            } else {
              console.warn(`No phone code found in Country entity for country_code: ${ipCountryCode}, using default +1.`);
            }
          } catch (error) {
            console.error('Error fetching phone code from Country entity:', error);
            // Fallback to default if Country entity lookup fails
          }
        }

        // If no IP country detected, try timezone fallback
        if (!ipCountryCode) {
          try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // A more comprehensive mapping would be needed for production
            const timezoneToCountryMap = {
              'America/New_York': { name: 'United States', code: 'US', phone: '+1' },
              'America/Los_Angeles': { name: 'United States', code: 'US', phone: '+1' },
              'Europe/London': { name: 'United Kingdom', code: 'GB', phone: '+44' },
              'Europe/Berlin': { name: 'Germany', code: 'DE', phone: '+49' },
              'Asia/Tokyo': { name: 'Japan', code: 'JP', phone: '+81' },
              'Asia/Shanghai': { name: 'China', code: 'CN', phone: '+86' },
              'Asia/Kolkata': { name: 'India', code: 'IN', phone: '+91' },
              'Asia/Jerusalem': { name: 'Israel', code: 'IL', phone: '+972' },
              'Africa/Cairo': { name: 'Egypt', code: 'EG', phone: '+20' },
              'Australia/Sydney': { name: 'Australia', code: 'AU', phone: '+61' },
            };

            const detected = timezoneToCountryMap[timezone];
            if (detected) {
              ipCountryName = detected.name;
              ipCountryCode = detected.code;
              phoneCountryCode = detected.phone;
              console.log('Detected via timezone fallback:', ipCountryName, ipCountryCode, phoneCountryCode);
            }
          } catch (error) {
            console.warn('Timezone fallback failed or not applicable', error);
          }
        }

        // Final fallback if all else fails
        if (!ipCountryCode) {
          ipCountryName = 'United States';
          ipCountryCode = 'US';
          phoneCountryCode = '+1'; // Default
          console.warn('All country detection methods failed, using default United States (+1)');
        }

        finalCountryData = {
          country_name: ipCountryName,
          country_code: ipCountryCode,
          phone_country_code: phoneCountryCode
        };

      } catch (error) {
        console.error('Unhandled error during country detection:', error);
        // Ensure a default is set even on unhandled errors
        finalCountryData = {
          country_name: 'United States',
          country_code: 'US',
          phone_country_code: '+1'
        };
      } finally {
        setDetectedCountry(finalCountryData);
        setLoading(false);
      }
    };

    detectCountryFromIP();
  }, []); // Empty dependency array ensures this effect runs once on mount
  return { detectedCountry, loading };
};

// Phone Number Validation Hook
export const usePhoneNumberValidation = (countryCode) => {
  const [error, setError] = useState('');
  const [requiredLength, setRequiredLength] = useState(10);

  useEffect(() => {
    const getPhoneRequirements = async () => {
      if (!countryCode) return;

      try {
        const countries = await Country.filter({ phone_country_code: countryCode });
        if (countries && countries.length > 0) {
          setRequiredLength(countries[0].phone_number_length);
        } else {
          // Fallback if no specific length found for the country code
          setRequiredLength(10);
        }
      } catch (error) {
        console.error('Error fetching phone requirements:', error);
        setRequiredLength(10); // Default on error
      }
    };

    getPhoneRequirements();
  }, [countryCode]);

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return false;
    }

    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (cleanNumber.length !== requiredLength) {
      setError(`Phone number must be ${requiredLength} digits`);
      return false;
    }

    setError('');
    return true;
  };

  return { error, validatePhoneNumber, requiredLength };
};

// Updated Auto Country Code Selector with Duplication Prevention
export const AutoCountryCodeSelector = ({
  selectedCountryCode,
  onCountryCodeChange,
  autoDetect = true,
  className = '',
  error = false
}) => {
  const { detectedCountry, loading: ipLoading } = useIPCountryDetection();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniqueCountries();
  }, []);

  useEffect(() => {
    // Auto-set country code when IP detection completes
    if (autoDetect && detectedCountry && !selectedCountryCode) {
      onCountryCodeChange(detectedCountry.phone_country_code);
    }
  }, [detectedCountry, autoDetect, selectedCountryCode, onCountryCodeChange]);

  const loadUniqueCountries = async () => {
    try {
      // Use the deduplication service to get unique countries
      const uniqueCountries = await CountryDataService.getUniqueCountries();
      setCountries(uniqueCountries);
    } catch (error) {
      console.error('Error loading unique countries:', error);
      // Fallback to basic list without duplicates
      setCountries([
        { phone_country_code: '+1', country_name: 'United States', country_code: 'US' },
        { phone_country_code: '+44', country_name: 'United Kingdom', country_code: 'GB' },
        { phone_country_code: '+972', country_name: 'Israel', country_code: 'IL' },
        { phone_country_code: '+91', country_name: 'India', country_code: 'IN' },
        { phone_country_code: '+49', country_name: 'Germany', country_code: 'DE' },
        { phone_country_code: '+33', country_name: 'France', country_code: 'FR' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || ipLoading) {
    return (
      <div className="flex items-center px-8 py-2.5 bg-gray-50 border border-gray-300 rounded-md">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedCountryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        className={`pl-8 pr-3 bg-gray-50 border border-gray-300 text-gray-700 rounded-md py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 appearance-none bg-no-repeat bg-left-3 bg-center bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3csvg%3e")] ${error ? 'border-red-500' : ''} ${className}`}
      >
        <option value="">Select Code</option>
        {countries.map((country) => (
          <option key={country.country_code} value={country.phone_country_code}>
            {country.phone_country_code} ({country.country_name})
          </option>
        ))}
      </select>
    </div>
  );
};

// Validated Phone Input with Verification Code Field
export const ValidatedPhoneInput = ({
  countryCode,
  phoneNumber,
  onPhoneNumberChange,
  className = '',
  disabled = false // Added disabled prop
}) => {
  const { error, validatePhoneNumber } = usePhoneNumberValidation(countryCode);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false); // Renamed from codeSent
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [sentCode, setSentCode] = useState(''); // Mock verification code
  const [isVerifying, setIsVerifying] = useState(false); // New state for verify button
  const [countdown, setCountdown] = useState(0); // New state for resend countdown
  const countdownRef = useRef(null); // Ref for countdown interval

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [countdown]);


  const handleSendVerification = async () => {
    // Ensure phone number is valid before sending code
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsSending(true);
    setVerificationError(''); // Clear any previous verification error
    setVerificationCode(''); // Clear previous verification code input
    console.log(`Sending verification to ${countryCode}${phoneNumber}`);

    // Mock API call - generate random 6-digit code
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(mockCode);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sending SMS (replace with real SMS service)
      setIsSending(false);
      setIsVerificationSent(true); // Updated state
      setCountdown(25); // Changed to 25 seconds as per outline
      alert(`Verification code sent: ${mockCode} (This is a demo - normally sent via SMS)`);
    } catch (error) {
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code.');
      return;
    }
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    if (verificationCode === sentCode) {
      setIsVerified(true);
      setIsVerificationSent(false); // Hide verification field on success
      setVerificationError('');
      // Clear countdown if running on successful verification
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        setCountdown(0);
      }
    } else {
      setVerificationError('Invalid verification code. Please try again.');
      setIsVerified(false);
    }
    setIsVerifying(false);
  };

  const handleNumberChange = (e) => {
    // only allow numbers
    const newNumber = e.target.value.replace(/\D/g, '');
    onPhoneNumberChange(newNumber);
    validatePhoneNumber(newNumber);
    setIsVerified(false);
    setIsVerificationSent(false); // Reset this state
    setVerificationCode('');
    setVerificationError('');
    if (countdownRef.current) { // Stop countdown if number changes
      clearInterval(countdownRef.current);
      setCountdown(0);
    }
    setSentCode(''); // Clear mock sent code
  };

  const hasValidNumber = phoneNumber && !error;

  return (
    <div className="space-y-4">
      {/* Phone Number Input Row */}
      <div className="flex items-center gap-2">
        <div className="flex-grow">
          <EnhancedInput
            type="tel"
            placeholder={disabled ? "Select a country code" : "Enter phone number"}
            value={phoneNumber}
            onChange={handleNumberChange}
            className={`w-full ${className}`}
            error={!!error}
            disabled={disabled}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {hasValidNumber && !isVerified && !isVerificationSent && (
          <Button
            onClick={handleSendVerification}
            disabled={isSending || disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
          >
            {isSending ? 'Sending...' : 'Send Code'}
          </Button>
        )}

        {isVerified && (
          <div className="flex items-center gap-1 text-green-600 whitespace-nowrap">
            <CheckCircle className="w-5 h-5" />
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Verification Code Field */}
      {isVerificationSent && !isVerified && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter 6-Digit Code
          </label>
          
          <div className="flex items-center gap-2">
            <EnhancedInput
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Verification Code"
              className={`flex-grow ${verificationError ? 'border-red-500 ring-red-500' : ''}`}
              maxLength={6}
              disabled={disabled || isVerifying}
            />
            <Button
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isVerifying || disabled}
              className="bg-gray-600 hover:bg-gray-700 text-white whitespace-nowrap"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>

          {verificationError && (
            <p className="text-sm text-red-600 mt-1">{verificationError}</p>
          )}

          <p className="text-sm text-gray-600">
            Not received your code?{' '}
            <button
              onClick={handleSendVerification}
              disabled={isSending || countdown > 0 || disabled}
              className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : (isSending ? 'Sending...' : 'Resend code')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
