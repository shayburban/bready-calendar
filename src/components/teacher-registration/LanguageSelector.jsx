
import React, { useMemo } from 'react';
import { useService } from './ServiceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GlobalCustomDropdownSelector from '../common/GlobalCustomDropdownSelector';
import { Languages } from 'lucide-react';

export default function LanguageSelector({
  value,          // optional: array of selected languages (e.g., [{ id: 'en', language: 'English', proficiency: 'fluent' }])
  onChange,       // optional: (nextArray) => void
  ...rest         // Rest of the props to pass to the root element
}) {
    // Internal state for when the component is used in an uncontrolled manner
    const [internalLanguages, setInternalLanguages] = React.useState([]);

    // Determine the source of selected languages: external prop 'value' or internal state
    const selectedLanguages = Array.isArray(value) ? value : internalLanguages;
    // Determine the setter for selected languages: external prop 'onChange' or internal state setter
    const setSelectedLanguages = typeof onChange === 'function' ? onChange : setInternalLanguages;

    const { languages: serviceLanguages, proficiencyLevels } = useService();

    const safeProficiencyLevels = proficiencyLevels || [];

    // Memoize the list of available languages for the dropdown
    const languages = useMemo(() => {
        const safeLanguages = serviceLanguages || [];
        return safeLanguages.map(lang => ({
            id: lang,
            label: `🌐 ${lang}`
        }));
    }, [serviceLanguages]);

    // Handles selection/deselection from the GlobalCustomDropdownSelector.
    // It receives the *full, updated list* of selected items.
    const handleSelect = (selectedItems) => {
        const updatedLanguages = selectedItems.map(item => ({
            language: item.name,      // 'name' from dropdown is the language string
            proficiency: item.proficiency,
            id: item.id,              // Ensure a stable ID for each selected language
            pending: item.pending
        }));
        setSelectedLanguages(updatedLanguages); // Update the state (internal or external)
    };

    // Handles submission of a new custom language from the dropdown's custom form
    const handleCustomSubmit = (customData) => {
        const newCustomLanguage = {
            language: customData.language,
            proficiency: customData.level,
            id: `custom-${Date.now()}`, // Generate a unique ID for custom entries
            pending: true // Mark as pending if needed, e.g., for backend approval
        };
        setSelectedLanguages(prev => {
            const base = Array.isArray(prev) ? prev : []; // Ensure 'prev' is always an array
            return [...base, newCustomLanguage]; // Add the new custom language
        });
    };

    // --- Specific state manipulation functions as per outline ---
    const handleAdd = (lang) => {
        setSelectedLanguages(prev => {
            const base = Array.isArray(prev) ? prev : [];
            return [...base, lang];
        });
    };

    const handleRemove = (langId) => {
        setSelectedLanguages(prev => (Array.isArray(prev) ? prev.filter(l => l.id !== langId) : []));
    };

    const handleSetProficiency = (langId, level) => {
        setSelectedLanguages(prev =>
            (Array.isArray(prev) ? prev : []).map(l => (l.id === langId ? { ...l, proficiency: level } : l))
        );
    };
    // -----------------------------------------------------------

    // Memoize the selected languages in the format expected by GlobalCustomDropdownSelector
    const currentSelectedLanguages = useMemo(() => {
        return (selectedLanguages || []).map(lang => ({
            id: lang.id || lang.language, // Use existing ID or language string as fallback ID
            name: lang.language,          // 'name' is used for display in the dropdown's chips
            label: `🌐 ${lang.language}`, // 'label' for internal dropdown list rendering if needed
            proficiency: lang.proficiency,
            pending: lang.pending
        }));
    }, [selectedLanguages]); // Recalculate if the selectedLanguages array changes
    
    return (
        <Card className="bg-white border shadow-sm" {...rest}> {/* Pass any additional props to the Card */}
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <Languages className="w-5 h-5 mr-3 text-gray-800" />
                    Languages Spoken
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <GlobalCustomDropdownSelector
                        options={languages}
                        placeholder="Select Language"
                        customFormFields={null} // No custom form fields for existing language selection
                        onCustomSubmit={handleCustomSubmit} // Callback for submitting a new custom language
                        onSelect={handleSelect} // Callback for when items are selected/deselected
                        selectedItems={currentSelectedLanguages} // The list of currently selected items
                        proficiencyLevels={safeProficiencyLevels} // Proficiency levels for each selected language
                    />
                </div>
            </CardContent>
        </Card>
    );
}
