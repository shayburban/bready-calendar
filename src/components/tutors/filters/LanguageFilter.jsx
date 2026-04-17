import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

const allLanguages = ["English", "Spanish", "French", "German", "Italian", "Mandarin", "Japanese"];

export default function LanguageFilter({ selected, onChange }) {
    const handleChange = (language, isChecked) => {
        if (isChecked) {
            onChange([...selected, language]);
        } else {
            onChange(selected.filter(lang => lang !== language));
        }
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {allLanguages.map((lang) => (
                    <div key={lang} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`lang-${lang}`}
                            checked={selected.includes(lang)}
                            onCheckedChange={(isChecked) => handleChange(lang, isChecked)}
                        />
                        <label
                          htmlFor={`lang-${lang}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {lang}
                        </label>
                    </div>
                ))}
            </div>
             <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => onChange([])}>Reset</Button>
        </div>
    );
}