
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, Type, Square, RotateCcw, FileText, Pencil, X, Check, Droplet, Scaling, CaseUpper } from 'lucide-react';
import ElementPreview from './ElementPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Helper to get a nested value from an object using a string path
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Configuration for what properties are editable for each component group
const EDITABLE_PROPS_MAP = {
  // --- Forms & Inputs ---
  1: { // Input Fields
    title: 'Input Fields',
    sections: {
      'Colors': [
        { label: 'Background Color', path: 'components.inputs.backgroundColor', type: 'color' },
        { label: 'Text Color', path: 'components.inputs.textColor', type: 'color' },
        { label: 'Placeholder Color', path: 'components.inputs.placeholderColor', type: 'color' },
        { label: 'Focus Border Color', path: 'components.inputs.focusBorder', type: 'color' },
      ],
      'Sizing & Spacing': [
        { label: 'Border Radius', path: 'components.inputs.borderRadius', type: 'text', placeholder: 'e.g., 6px' },
        { label: 'Padding', path: 'components.inputs.padding', type: 'text', placeholder: 'e.g., 12px' },
        { label: 'Border', path: 'components.inputs.border', type: 'text', placeholder: 'e.g., 1px solid #d1d5db' },
      ],
      'Typography': [
        { label: 'Font Size', path: 'components.inputs.fontSize', type: 'text', placeholder: 'e.g., 14px' },
      ]
    }
  },
  2: { // Dropdown Menus
    title: 'Dropdowns',
    sections: {
      'Colors': [
        { label: 'Background', path: 'components.dropdowns.backgroundColor', type: 'color' },
        { label: 'Border Color', path: 'components.dropdowns.borderColor', type: 'color' },
        { label: 'Item Text', path: 'components.dropdowns.itemTextColor', type: 'color' },
        { label: 'Item Hover BG', path: 'components.dropdowns.itemHoverBackgroundColor', type: 'color' },
        { label: 'Item Selected BG', path: 'components.dropdowns.itemSelectedBackgroundColor', type: 'color' },
        { label: 'Item Selected Text', path: 'components.dropdowns.itemSelectedTextColor', type: 'color' },
      ],
      'Sizing & Spacing': [
        { label: 'Border Radius', path: 'components.dropdowns.borderRadius', type: 'text', placeholder: 'e.g., 6px' },
      ]
    }
  },
  // --- Buttons ---
  7: { // Primary Buttons
    title: 'Primary Buttons',
    sections: {
      'Colors': [
        { label: 'Background Color', path: 'components.buttons.variants.primary.bg', type: 'color' },
        { label: 'Text Color', path: 'components.buttons.variants.primary.color', type: 'color' },
      ],
      'Sizing & Spacing': [
        { label: 'Border Radius', path: 'components.buttons.borderRadius', type: 'text' },
        { label: 'Padding (X)', path: 'components.buttons.paddingX', type: 'text' },
        { label: 'Padding (Y)', path: 'components.buttons.paddingY', type: 'text' },
        { label: 'Border', path: 'components.buttons.variants.primary.border', type: 'text' },
      ],
      'Typography': [
        { label: 'Font Size', path: 'components.buttons.fontSize', type: 'text' },
        { label: 'Font Weight', path: 'components.buttons.fontWeight', type: 'number' },
      ]
    }
  },
  8: { // Secondary Buttons
    title: 'Secondary Buttons',
    sections: {
      'Colors': [
        { label: 'Background Color', path: 'components.buttons.variants.secondary.bg', type: 'color' },
        { label: 'Text Color', path: 'components.buttons.variants.secondary.color', type: 'color' },
      ],
      'Sizing & Spacing': [
         { label: 'Border', path: 'components.buttons.variants.secondary.border', type: 'text' },
      ],
    }
  },
  // --- Content & Layout ---
  18: { // Cards
    title: 'Cards',
    sections: {
      'Sizing & Spacing': [
        { label: 'Border Radius', path: 'components.cards.borderRadius', type: 'text' },
        { label: 'Padding', path: 'components.cards.padding', type: 'text' },
        { label: 'Border', path: 'components.cards.border', type: 'text' },
      ],
      'Effects': [
         { label: 'Box Shadow', path: 'components.cards.shadow', type: 'text' },
      ]
    }
  },
  // --- Feedback ---
  24: { // Tooltips
    title: 'Tooltips',
    sections: {
      'Colors': [
        { label: 'Background Color', path: 'components.tooltips.backgroundColor', type: 'color' },
        { label: 'Text Color', path: 'components.tooltips.textColor', type: 'color' },
      ],
      'Sizing & Spacing': [
        { label: 'Border Radius', path: 'components.tooltips.borderRadius', type: 'text' },
        { label: 'Padding', path: 'components.tooltips.padding', type: 'text' },
      ],
      'Typography': [
        { label: 'Font Size', path: 'components.tooltips.fontSize', type: 'text' },
      ]
    }
  },
  // --- Typography ---
  29: { // Text Headers
    title: 'Typography - Headings',
    sections: {
      'Fonts': [
        { label: 'Font Family', path: 'typography.fontFamily', type: 'text' },
        { label: 'Bold Weight', path: 'typography.fontWeights.bold', type: 'number' },
        { label: 'Semibold Weight', path: 'typography.fontWeights.semibold', type: 'number' },
      ],
      'Sizing': [
        { label: 'Heading Scale Ratio', path: 'typography.headingScale', type: 'number', step: 0.1 },
      ]
    }
  },
  30: { // Body Text
    title: 'Typography - Body',
    sections: {
      'Fonts': [
        { label: 'Font Family', path: 'typography.fontFamily', type: 'text' },
        { label: 'Normal Weight', path: 'typography.fontWeights.normal', type: 'number' },
        { label: 'Medium Weight', path: 'typography.fontWeights.medium', type: 'number' },
      ],
      'Sizing & Spacing': [
        { label: 'Base Font Size', path: 'typography.baseSize', type: 'text' },
        { label: 'Line Height', path: 'typography.lineHeight', type: 'number', step: 0.1 },
      ]
    }
  }
};


export default function ElementGroupEditor({ group, systemConfig, onStyleChange, pageUsage = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftConfig, setDraftConfig] = useState(systemConfig);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // When the selected group or the main config changes, sync the draft and exit edit mode.
    setDraftConfig(systemConfig);
    setIsEditing(false);
  }, [group, systemConfig]);

  const handleEnterEditMode = () => {
    setOriginalConfig(JSON.parse(JSON.stringify(systemConfig))); // Deep copy for restoration
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftConfig(originalConfig); // Restore from the saved copy
    setIsEditing(false);
  };

  const handleConfirmChanges = () => {
    setShowConfirm(true);
  };

  const applyChanges = () => {
    const changes = getChanges();
    changes.forEach(change => {
      // The 'property' in the change object is the label, not the path.
      // We need to find the original path from EDITABLE_PROPS_MAP
      const editableProps = EDITABLE_PROPS_MAP[group.id];
      if (editableProps) {
        const propDefinition = Object.values(editableProps.sections).flat().find(p => p.label === change.property);
        if (propDefinition) {
          onStyleChange(group.id, propDefinition.path, change.newValue);
        }
      }
    });
    setIsEditing(false);
    setShowConfirm(false);
  };
  
  const handleDraftChange = (path, value) => {
    if (!path) return;

    setDraftConfig(prevConfig => {
      const newConfig = JSON.parse(JSON.stringify(prevConfig));
      let current = newConfig;
      const pathArray = path.split('.');
      for (let i = 0; i < pathArray.length - 1; i++) {
        // Create nested objects if they don't exist
        if (typeof current[pathArray[i]] !== 'object' || current[pathArray[i]] === null) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      current[pathArray[pathArray.length - 1]] = value;
      return newConfig;
    });
  };
  
   const getChanges = () => {
    if (!originalConfig) return [];
    const changes = [];
    const editableProps = EDITABLE_PROPS_MAP[group.id];
    if (!editableProps) return [];
    
    Object.values(editableProps.sections).flat().forEach(prop => {
        const oldValue = getNestedValue(originalConfig, prop.path);
        const newValue = getNestedValue(draftConfig, prop.path);

        // Compare values, handling potential undefined or null differences
        // JSON.stringify provides a robust way to compare values, including objects/arrays
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
                property: prop.label, // Use label for display in confirmation
                oldValue: oldValue === undefined || oldValue === null ? 'N/A' : String(oldValue),
                newValue: newValue === undefined || newValue === null ? 'N/A' : String(newValue),
            });
        }
    });

    return changes;
  };

  if (!group) return null;

  const ColorInput = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border-gray-300 p-0.5" />
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="text-xs h-8 font-mono" />
      </div>
    </div>
  );

  const GeneralInput = ({ label, value, onChange, placeholder, type = 'text', step }) => (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <Input 
        value={value === undefined || value === null ? '' : value} // Ensure controlled component gets a string
        onChange={(e) => {
          let val = e.target.value;
          if (type === 'number') {
            val = parseFloat(val);
            if (isNaN(val)) val = ''; // Handle empty string for number input
          }
          onChange(val);
        }} 
        placeholder={placeholder} 
        className="text-xs h-8"
        type={type}
        step={step}
      />
    </div>
  );

  const renderGroupEditor = () => {
    const editorConfig = EDITABLE_PROPS_MAP[group.id];
    const currentData = isEditing ? draftConfig : systemConfig;

    if (!isEditing || !editorConfig) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Pencil className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Click the edit icon above to customize this component.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(editorConfig.sections).map(([sectionTitle, props]) => (
          <div key={sectionTitle}>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                {sectionTitle === 'Colors' && <Droplet className="w-4 h-4 text-blue-600" />}
                {sectionTitle === 'Sizing & Spacing' && <Scaling className="w-4 h-4 text-green-600" />}
                {sectionTitle === 'Typography' && <CaseUpper className="w-4 h-4 text-purple-600" />}
                {sectionTitle === 'Effects' && <Palette className="w-4 h-4 text-yellow-600" />} {/* Added for effects section */}
                {sectionTitle}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {props.map(prop => {
                const value = getNestedValue(currentData, prop.path);
                const changeHandler = (newValue) => handleDraftChange(prop.path, newValue);
                
                if (prop.type === 'color') {
                  return <ColorInput key={prop.path} label={prop.label} value={value} onChange={changeHandler} />;
                }
                return <GeneralInput key={prop.path} label={prop.label} value={value} onChange={changeHandler} placeholder={prop.placeholder} type={prop.type} step={prop.step} />;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">#{group.id}</Badge>
        <span className="font-medium">{group.name}</span>
        <Badge className="text-xs">{group.category}</Badge>
      </div>

      <div className="text-xs text-gray-600 mb-4"><strong>Targets:</strong> {group.selector}</div>
      <div className="text-xs text-gray-600 mb-6">{group.description}</div>

      <div className="relative border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
        <ElementPreview group={group} systemConfig={isEditing ? draftConfig : systemConfig} />
        {!isEditing && (
          <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-white" onClick={handleEnterEditMode}>
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator />

      <div className="mt-6">
        {renderGroupEditor()}
      </div>
      
      {isEditing && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">You are in Edit Mode</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleConfirmChanges} size="sm" className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Confirm Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="mt-6">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-gray-600" /> Used on Pages</h4>
        <div className="flex flex-wrap gap-2">
          {pageUsage.length > 0 ? pageUsage.map(page => <Badge key={page} variant="outline">{page}</Badge>) : <p className="text-xs text-gray-500">No specific page usage defined for this element.</p>}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the changes below. Are you sure you want to apply them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm my-4 max-h-60 overflow-y-auto">
             <ul className="list-disc pl-5 space-y-2">
              {getChanges().map((c, i) => (
                <li key={i}>
                  <strong className="capitalize">{c.property.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-gray-500">{String(c.oldValue)}</span> → <span className="font-semibold text-green-700">{String(c.newValue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyChanges}>Apply Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
