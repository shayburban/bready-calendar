import React, { useMemo } from 'react';
import { actionTypes } from '@/components/teacherSearch/searchReducer';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SubjectFilter = ({ state, dispatch }) => {
    const { filters } = state;

    // Extract unique subjects from all teachers
    const availableSubjects = useMemo(() => {
        const subjects = new Set();
        state.allTeachers.forEach(teacher => {
            teacher.subjects?.forEach(subject => subjects.add(subject));
        });
        return Array.from(subjects).sort();
    }, [state.allTeachers]);

    const handleSubjectChange = (subject, checked) => {
        const newSubjects = checked 
            ? [...filters.subjects, subject]
            : filters.subjects.filter(s => s !== subject);
        
        dispatch({
            type: actionTypes.APPLY_FILTER,
            payload: { filterType: 'subjects', value: newSubjects }
        });
    };

    return (
        <AccordionItem value="subjects">
            <AccordionTrigger className="text-sm font-medium">
                Subjects ({filters.subjects.length})
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2">
                    {availableSubjects.map(subject => (
                        <div key={subject} className="flex items-center space-x-2">
                            <Checkbox
                                id={`subject-${subject}`}
                                checked={filters.subjects.includes(subject)}
                                onCheckedChange={(checked) => handleSubjectChange(subject, checked)}
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm">
                                {subject}
                            </Label>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default SubjectFilter;