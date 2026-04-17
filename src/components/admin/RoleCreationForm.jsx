import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

const FormTabButton = ({ label, isActive, onClick, disabled = false }) => (
    <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={`transition-all flex-1 ${isActive ? 'bg-blue-600 hover:bg-blue-700 shadow' : 'text-gray-600 bg-white'}`}
    >
        {label}
    </Button>
);

const InputField = ({ label, value, onChange, placeholder, isRequired, helpText, disabled = false }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label} {isRequired && <span className="text-red-500">*</span>}</label>
    <Input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} />
    {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
  </div>
);

const SelectField = ({ label, value, onValueChange, items, placeholder, isRequired, disabled = false }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label} {isRequired && <span className="text-red-500">*</span>}</label>
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
);

export default function RoleCreationForm({ formData, setFormData, handleSubmit, onCancel, editingRole, roles }) {
    const getInitialTab = () => {
        if (editingRole) {
            if (editingRole.organization_group) return 'external_admin';
            if (editingRole.usageContext === 'external') return 'external';
        }
        return 'internal';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    useEffect(() => {
        if (editingRole) return; 

        if (activeTab === 'internal') {
            setFormData(prev => ({ ...prev, usageContext: 'internal', organization_group: '' }));
        } else if (activeTab === 'external') {
            setFormData(prev => ({ ...prev, usageContext: 'external', organization_group: '' }));
        } else if (activeTab === 'external_admin') {
            setFormData(prev => ({ ...prev, usageContext: 'external' }));
        }
    }, [activeTab, setFormData, editingRole]);

    const getPrimaryRoles = () => roles.filter(role => role.is_primary_role);

    const ROLE_TYPES = {
        PRIMARY: 'Primary Role',
        PERSPECTIVE: 'Perspective'
    };

    const tabs = [
        { key: 'internal', label: 'Internal' },
        { key: 'external', label: 'External Role' },
        { key: 'external_admin', label: 'External Admin Role' }
    ];

    return (
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                {tabs.map(tab => (
                    <FormTabButton 
                        key={tab.key}
                        label={tab.label}
                        isActive={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        disabled={!!editingRole}
                    />
                ))}
            </div>

            <InputField label="Display Name" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} placeholder="e.g., Teacher, As a Teacher" isRequired />
            <InputField label="Role ID" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} placeholder="e.g., teacher, teacher-t" isRequired helpText="Lowercase, unique, no spaces." disabled={!!editingRole}/>
            <InputField label="Abbreviation" value={formData.abbreviation_code} onChange={e => setFormData({...formData, abbreviation_code: e.target.value})} placeholder="e.g., T, S, D, P" isRequired />

            {activeTab === 'external_admin' && (
                 <InputField label="Organization Group" value={formData.organization_group} onChange={e => setFormData({...formData, organization_group: e.target.value})} placeholder="e.g., Hospital A, University B" helpText="Required for External Admin Roles." isRequired />
            )}

            <SelectField 
                label="Type" 
                value={formData.is_primary_role ? "primary" : "perspective"} 
                onValueChange={v => setFormData({...formData, is_primary_role: v === "primary", parent_role_id: v === "primary" ? '' : formData.parent_role_id})} 
                items={[{value: "primary", label: ROLE_TYPES.PRIMARY}, {value: "perspective", label: ROLE_TYPES.PERSPECTIVE}]} isRequired 
            />
            
            {!formData.is_primary_role && (
                <SelectField 
                    label="Parent Role" 
                    value={formData.parent_role_id} 
                    onValueChange={v => setFormData({...formData, parent_role_id: v})} 
                    items={getPrimaryRoles().map(r => ({value: r.role_id, label: `${r.display_name} (${r.organization_group || 'Global'})`}))} 
                    placeholder="Select parent role" 
                    isRequired 
                />
            )}
            
            <InputField label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional description" />

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" />{editingRole ? 'Update Role' : 'Create Role'}</Button>
            </div>
        </div>
    );
}