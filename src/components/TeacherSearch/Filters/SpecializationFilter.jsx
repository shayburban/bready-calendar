import React, { useMemo } from 'react';
import { actionTypes } from '@/components/TeacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SpecializationFilter = ({ state, dispatch }) => {
    const { filters } = state;

    // Extract unique specializations from all teachers
    const availableSpecializations = useMemo(() => {
        const specializations = new Set();
        state.allTeachers.forEach(teacher => {
            teacher.specializations?.forEach(spec => specializations.add(spec));
        });
        return Array.from(specializations).sort();
    }, [state.allTeachers]);

    const handleSpecializationChange = (specialization, checked) => {
        const newSpecializations = checked 
            ? [...filters.specializations, specialization]
            : filters.specializations.filter(s => s !== specialization);
        
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'specializations', value: newSpecializations }
        });
    };

    return (
        <AccordionItem value="specializations">
            <AccordionTrigger className="text-sm font-medium">
                Specializations ({filters.specializations.length})
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2">
                    {availableSpecializations.map(specialization => (
                        <div key={specialization} className="flex items-center space-x-2">
                            <Checkbox
                                id={`spec-${specialization}`}
                                checked={filters.specializations.includes(specialization)}
                                onCheckedChange={(checked) => handleSpecializationChange(specialization, checked)}
                            />
                            <Label htmlFor={`spec-${specialization}`} className="text-sm">
                                {specialization}
                            </Label>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default SpecializationFilter;