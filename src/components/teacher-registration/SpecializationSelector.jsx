import React, { useMemo } from 'react';
import { useTeacher } from './TeacherContext';
import { useService } from './ServiceContext';
import { Sparkles } from 'lucide-react';
import GlobalCustomDropdownSelector from '../common/GlobalCustomDropdownSelector';

const SpecializationSelector = () => {
    const { allSpecs, dispatchAllSpecs } = useTeacher();
    const { specializations } = useService();

    const safeSpecializations = specializations || [];
    const safeAllSpecs = allSpecs || [];

    const specializationOptions = useMemo(() => (
        safeSpecializations.map(spec => ({
            id: `${spec.spec}-${spec.subject}`,
            label: spec.spec,
        }))
    ), [safeSpecializations]);

    const handleSpecializationSelection = (selectedItems, isValid) => {
        const updatedSpecs = selectedItems.map(item => {
            const originalSpec = safeSpecializations.find(s => s.spec === item.name);
            return {
                specialization: item.name,
                subject: originalSpec?.subject || 'General',
                level: item.proficiency || '',
                description: '',
                isCustom: item.pending || false,
                id: item.id
            };
        });
        dispatchAllSpecs({ type: 'SET_SPECS', payload: updatedSpecs });
    };

    const handleCustomSpecSubmit = (customData) => {
        const newSpec = {
            specialization: customData.specialization,
            subject: 'General', // Default subject
            level: customData.level,
            description: customData.description || '',
            isCustom: true,
            id: Date.now().toString(),
            status: 'pending'
        };
        dispatchAllSpecs({ type: 'ADD_SPEC', payload: newSpec });
    };

    const currentSelectedSpecs = useMemo(() => (
        safeAllSpecs.map(spec => ({
            id: spec.id,
            name: spec.specialization,
            label: spec.specialization,
            proficiency: spec.level,
            pending: spec.isCustom && spec.status === 'pending'
        }))
    ), [safeAllSpecs]);

    const customFormFields = [
        { name: 'specialization', label: 'Specialization Name', type: 'text', required: true },
        { name: 'level', label: 'Proficiency Level', type: 'select', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: false }
    ];

    return (
        <div className="space-y-4">
            <GlobalCustomDropdownSelector
                options={specializationOptions}
                placeholder="Select Specialization"
                onSelect={handleSpecializationSelection}
                customFormTitle="Didn't find your specialization? Click here."
                customFormFields={customFormFields}
                onCustomSubmit={handleCustomSpecSubmit}
                selectedItems={currentSelectedSpecs}
                className="w-full"
                popoverTitle="Select Specialization"
                searchPlaceholder="Search specializations..."
                selectedItemsTitle="Selected Specializations"
                proficiencyLevels={['Expert', 'Intermediate', 'Beginner']}
                showItemIcon={false}
                triggerIcon={<Sparkles className="h-4 w-4" />}
            />
        </div>
    );
};

export default SpecializationSelector;