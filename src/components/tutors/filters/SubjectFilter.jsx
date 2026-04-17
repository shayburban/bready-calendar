import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const allSubjects = ["Chemistry", "Mathematics", "Physics", "Biology", "Computer Science", "History"];

export default function SubjectFilter({ selected, onChange }) {
     const handleChange = (subject, isChecked) => {
        if (isChecked) {
            onChange([...selected, subject]);
        } else {
            onChange(selected.filter(sub => sub !== subject));
        }
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {allSubjects.map((sub) => (
                     <div key={sub} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`sub-${sub}`} 
                            checked={selected.includes(sub)}
                            onCheckedChange={(isChecked) => handleChange(sub, isChecked)}
                         />
                        <label
                          htmlFor={`sub-${sub}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {sub}
                        </label>
                    </div>
                ))}
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => onChange([])}>Reset</Button>
        </div>
    );
}