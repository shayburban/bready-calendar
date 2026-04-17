
import React, { useState, useEffect } from 'react';
import { useTeacher } from '../TeacherContext';
import { Button } from '@/components/ui/button';
import { useIPCountryDetection, ValidatedPhoneInput } from '@/components/common/IPCountryDetection';
import { CountryDataService } from '@/components/common/CountryDuplicationPrevention';
import SearchableDropdownField from '@/components/common/SearchableDropdownField';
import { DynamicTimezone } from '@/components/common/DynamicTimezone';
import { Input } from '@/components/ui/input'; // New import for the Input component
import { User } from 'lucide-react'; // New import for the User icon

const ProfileForm = () => {
    const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();
    const [countryCodeOptions, setCountryCodeOptions] = useState([]);
    const [isLoadingCountryCodes, setIsLoadingCountryCodes] = useState(true);
    const { detectedCountry, loading: ipLoading } = useIPCountryDetection();

    // Base classes for consistent input styling
    const inputBaseClasses = "bg-gray-50 rounded-md px-3 py-2.5 w-full text-sm font-medium focus:outline-none focus:ring-2";
    const labelBaseClasses = "block text-sm font-medium text-gray-700 mb-1";

    // Name validation function - prevents numbers and invalid characters
    const isValidNameInput = (value) => {
        // Regex allows: letters (including international), spaces, hyphens, apostrophes
        const namePattern = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s\-']*$/;
        return namePattern.test(value);
    };

    // First name change handler with validation
    const handleFirstNameChange = (e) => {
        const value = e.target.value;
        if (isValidNameInput(value)) {
            setPersonalInfo(prev => ({ ...prev, firstName: value }));
        }
    };

    // Last name change handler with validation  
    const handleLastNameChange = (e) => {
        const value = e.target.value;
        if (isValidNameInput(value)) {
            setPersonalInfo(prev => ({ ...prev, lastName: value }));
        }
    };

    useEffect(() => {
        const loadCountryCodes = async () => {
            setIsLoadingCountryCodes(true);
            try {
                const uniqueCountries = await CountryDataService.getUniqueCountries();
                const options = uniqueCountries.map(country => ({
                    label: `${country.phone_country_code} (${country.country_name})`,
                    value: country.phone_country_code,
                }));
                setCountryCodeOptions(options);
            } catch (error) {
                console.error("Failed to load countries", error);
            } finally {
                setIsLoadingCountryCodes(false);
            }
        };
        loadCountryCodes();
    }, []);

    useEffect(() => {
        if (ipLoading || isLoadingCountryCodes) return;

        // Auto-fill phoneCountryCode if detected and not already set
        if (detectedCountry && detectedCountry.phone_country_code && !personalInfo.phoneCountryCode) {
            setPersonalInfo(prev => ({
                ...prev,
                phoneCountryCode: detectedCountry.phone_country_code
            }));
        }
    }, [detectedCountry, ipLoading, isLoadingCountryCodes, personalInfo.phoneCountryCode, setPersonalInfo]);

    const handleCountryCodeSelect = (option) => {
        setPersonalInfo({
            ...personalInfo,
            phoneCountryCode: option.value
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label htmlFor="firstName" className={labelBaseClasses}>
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        id="firstName"
                        value={personalInfo.firstName || ''}
                        onChange={handleFirstNameChange}
                        className={`${inputBaseClasses} ${errors.firstName ? 'border border-red-500 focus:ring-red-500 focus:border-red-500' : 'border border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="Enter your first name"
                        aria-describedby="firstName-error"
                    />
                    {errors.firstName && <p id="firstName-error" className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="lastName" className={labelBaseClasses}>
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        id="lastName"
                        value={personalInfo.lastName || ''}
                        onChange={handleLastNameChange}
                        className={`${inputBaseClasses} ${errors.lastName ? 'border border-red-500 focus:ring-red-500 focus:border-red-500' : 'border border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="Enter your last name"
                        aria-describedby="lastName-error"
                    />
                    {errors.lastName && <p id="lastName-error" className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email - Now Editable */}
                <div>
                    <label htmlFor="email" className={labelBaseClasses}>
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="email"
                        type="email"
                        value={personalInfo.email || ''}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        className={`${inputBaseClasses} ${errors.email ? 'border border-red-500 focus:ring-red-500 focus:border-red-500' : 'border border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'}`}
                        aria-describedby="email-error"
                        placeholder="Enter your email"
                    />
                    {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone Number Section - Preserved existing structure */}
                <div>
                    <label className={labelBaseClasses}>
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-1">
                            <SearchableDropdownField
                                options={countryCodeOptions}
                                selectedValue={personalInfo.phoneCountryCode || ''}
                                onSelect={handleCountryCodeSelect}
                                placeholder="Select country code"
                                searchPlaceholder="Search countries..."
                                searchType="startsWith"
                                loading={isLoadingCountryCodes}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <ValidatedPhoneInput
                                countryCode={personalInfo.phoneCountryCode}
                                phoneNumber={personalInfo.phone || ''}
                                onPhoneNumberChange={(number) => setPersonalInfo({ ...personalInfo, phone: number })}
                            />
                        </div>
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
            </div>

            {/* Location and Timezone - Preserved existing structure */}
            {/* The original was col-span-1 md:col-span-2 within a grid. Now it's a direct child of space-y-6 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Timezone
                </label>
                <DynamicTimezone />
            </div>
        </div>
    );
};

export default ProfileForm;
