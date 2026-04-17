import React, { useMemo } from 'react';
import { useTeacher } from './TeacherContext';
import { useService } from './ServiceContext';
import { BookOpen } from 'lucide-react';
import GlobalCustomDropdownSelector from '../common/GlobalCustomDropdownSelector';

const SubjectSelector = () => {
    const { teachingSubjects, dispatchTeachingSubjects } = useTeacher();
    const { subjects, levels } = useService();

    const safeSubjects = subjects || [];
    const safeTeachingSubjects = teachingSubjects || [];

    const subjectOptions = useMemo(() => {
        return safeSubjects.map(subject => ({
            id: subject.id.toString(),
            label: subject.subName,
        }));
    }, [safeSubjects]);

    const handleSubjectSelection = (selectedItems, isValid) => {
        const updatedSubjects = selectedItems.map(item => {
            const originalSubject = safeSubjects.find(s => s.id.toString() === item.id);
            return {
                subject: originalSubject ? originalSubject.subName : item.name,
                level: item.proficiency || '',
                id: item.id,
                isCustom: item.pending || false
            };
        });

        dispatchTeachingSubjects({ type: 'SET_SUBJECTS', payload: updatedSubjects });
    };

    const handleCustomSubjectSubmit = (customData) => {
        const newSubject = {
            subject: customData.subject,
            level: customData.level,
            id: Date.now().toString(),
            isCustom: true,
            status: 'pending'
        };
        
        dispatchTeachingSubjects({ type: 'ADD_SUBJECT', payload: newSubject });
    };

    const currentSelectedSubjects = useMemo(() => {
        return safeTeachingSubjects.map(subject => ({
            id: subject.id,
            name: subject.subject,
            label: subject.subject,
            proficiency: subject.level,
            pending: subject.isCustom && subject.status === 'pending'
        }));
    }, [safeTeachingSubjects]);

    const customFormFields = [
        { name: 'subject', label: 'Subject Name', type: 'text', required: true },
        { name: 'level', label: 'Proficiency Level', type: 'select', required: true }
    ];

    return (
        <div className="space-y-4">
            <GlobalCustomDropdownSelector
                options={subjectOptions}
                placeholder="Select Subject"
                onSelect={handleSubjectSelection}
                customFormTitle="Did not find your subject? Click here."
                customFormFields={customFormFields}
                onCustomSubmit={handleCustomSubjectSubmit}
                selectedItems={currentSelectedSubjects}
                className="w-full"
                // Customization Props
                popoverTitle="Select Subject"
                searchPlaceholder="Search subjects..."
                selectedItemsTitle="Selected Subjects"
                proficiencyLevels={['Expert', 'Intermediate', 'Beginner']}
                showItemIcon={false}
                triggerIcon={<BookOpen className="h-4 w-4" />}
            />
        </div>
    );
};

export default SubjectSelector;