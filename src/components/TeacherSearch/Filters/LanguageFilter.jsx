import React, { useMemo } from 'react';
import { actionTypes } from '@/components/TeacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const LanguageFilter = ({ state, dispatch }) => {
    const { filters } = state;

    // Extract unique languages from all teachers
    const availableLanguages = useMemo(() => {
        const languages = new Set();
        state.allTeachers.forEach(teacher => {
            teacher.languages?.forEach(lang => languages.add(lang));
        });
        return Array.from(languages).sort();
    }, [state.allTeachers]);

    const handleLanguageChange = (language, checked) => {
        const newLanguages = checked 
            ? [...filters.languages, language]
            : filters.languages.filter(l => l !== language);
        
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'languages', value: newLanguages }
        });
    };

    return (
        <AccordionItem value="languages">
            <AccordionTrigger className="text-sm font-medium">
                Languages ({filters.languages.length})
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2">
                    {availableLanguages.map(language => (
                        <div key={language} className="flex items-center space-x-2">
                            <Checkbox
                                id={`lang-${language}`}
                                checked={filters.languages.includes(language)}
                                onCheckedChange={(checked) => handleLanguageChange(language, checked)}
                            />
                            <Label htmlFor={`lang-${language}`} className="text-sm">
                                {language}
                            </Label>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default LanguageFilter;