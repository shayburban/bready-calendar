import React, { useState, useRef } from 'react';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import { ChevronDown } from 'lucide-react';

const LanguageCurrencyDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    const languages = ['English', 'Hindi', 'Bengali', 'Tamil'];
    const currencies = ['USD', 'EUR', 'GBP', 'INR'];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn flex items-center gap-1.5"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {`${selectedLanguage}, ${selectedCurrency}`}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                            <select
                                id="language-select"
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                id="currency-select"
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                {currencies.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageCurrencyDropdown;