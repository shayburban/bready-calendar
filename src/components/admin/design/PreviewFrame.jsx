import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Zap, Target } from 'lucide-react';

export default function PreviewFrame({ 
  page, 
  role, 
  systemConfig, 
  designOverrides = [], 
  onElementClick, 
  selectedGroup,
  elementGroups = [],
  fullPreview = false 
}) {
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');

  // Generate CSS from system config
  const generatePreviewCSS = () => {
    const css = `
      .preview-frame {
        font-family: ${systemConfig.typography?.fontFamily || 'Inter, sans-serif'};
        background-color: ${systemConfig.globalColors?.background || '#ffffff'};
        color: ${systemConfig.globalColors?.text || '#1f2937'};
      }
      
      .preview-frame input,
      .preview-frame .input-field {
        border-radius: ${systemConfig.components?.inputs?.borderRadius || '6px'};
        padding: ${systemConfig.components?.inputs?.padding || '12px'};
        font-size: ${systemConfig.components?.inputs?.fontSize || '14px'};
        border: ${systemConfig.components?.inputs?.border || '1px solid #d1d5db'};
        background-color: ${systemConfig.components?.inputs?.backgroundColor || '#ffffff'};
        color: ${systemConfig.components?.inputs?.textColor || '#1f2937'};
      }
      
      .preview-frame .dropdown,
      .preview-frame select {
        border-radius: ${systemConfig.components?.dropdowns?.borderRadius || '6px'};
        background-color: ${systemConfig.components?.dropdowns?.backgroundColor || '#ffffff'};
        border-color: ${systemConfig.components?.dropdowns?.borderColor || '#d1d5db'};
        color: ${systemConfig.components?.dropdowns?.itemTextColor || '#1f2937'};
      }
      
      .preview-frame .btn-primary {
        background-color: ${systemConfig.components?.buttons?.variants?.primary?.bg || '#0263c4'};
        color: ${systemConfig.components?.buttons?.variants?.primary?.color || '#ffffff'};
        border-radius: ${systemConfig.components?.buttons?.borderRadius || '6px'};
        padding: ${systemConfig.components?.buttons?.paddingY || '8px'} ${systemConfig.components?.buttons?.paddingX || '16px'};
      }
      
      .preview-frame .card {
        border-radius: ${systemConfig.components?.cards?.borderRadius || '8px'};
        padding: ${systemConfig.components?.cards?.padding || '24px'};
        box-shadow: ${systemConfig.components?.cards?.shadow || '0 1px 3px rgba(0, 0, 0, 0.1)'};
        border: ${systemConfig.components?.cards?.border || '1px solid #e5e7eb'};
      }
      
      .preview-frame .tooltip {
        background-color: ${systemConfig.components?.tooltips?.backgroundColor || '#1f2937'};
        color: ${systemConfig.components?.tooltips?.textColor || '#ffffff'};
        border-radius: ${systemConfig.components?.tooltips?.borderRadius || '4px'};
        padding: ${systemConfig.components?.tooltips?.padding || '8px 12px'};
        font-size: ${systemConfig.components?.tooltips?.fontSize || '12px'};
      }
      
      .preview-frame h1, .preview-frame h2, .preview-frame h3 {
        color: ${systemConfig.globalColors?.text || '#1f2937'};
        font-weight: ${systemConfig.typography?.fontWeights?.bold || 700};
      }
      
      .element-highlight {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        position: relative;
      }
      
      .element-highlight::after {
        content: '#' attr(data-group-id);
        position: absolute;
        top: -20px;
        left: 0;
        background: #3b82f6;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        border-radius: 2px;
        font-weight: bold;
      }
      
      .element-hover {
        outline: 1px dashed #6b7280 !important;
        outline-offset: 1px;
      }
    `;
    
    return css;
  };

  // Mock page content for preview
  const getMockPageContent = () => {
    const commonElements = (
      <div className="preview-frame p-6 space-y-6">
        <style>{generatePreviewCSS()}</style>
        
        <div 
          className="element-group"
          data-group-id="29"
          onClick={() => onElementClick(29)}
        >
          <h1 className="text-3xl font-bold mb-2">Page Title</h1>
          <h2 className="text-xl font-semibold mb-4">Section Header</h2>
        </div>
        
        <div 
          className="card bg-white border rounded-lg p-6 element-group"
          data-group-id="18"
          onClick={() => onElementClick(18)}
        >
          <h3 className="text-lg font-medium mb-4">Sample Form</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                className="input-field w-full element-group"
                data-group-id="1"
                onClick={(e) => { e.stopPropagation(); onElementClick(1); }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select 
                className="dropdown w-full p-3 border element-group"
                data-group-id="2"
                onClick={(e) => { e.stopPropagation(); onElementClick(2); }}
              >
                <option>Select a subject</option>
                <option>Mathematics</option>
                <option>Physics</option>
                <option>Chemistry</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="btn-primary px-4 py-2 rounded element-group"
                data-group-id="7"
                onClick={(e) => { e.stopPropagation(); onElementClick(7); }}
              >
                Primary Button
              </button>
              <button 
                className="btn-secondary px-4 py-2 border rounded element-group"
                data-group-id="8"
                onClick={(e) => { e.stopPropagation(); onElementClick(8); }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
        
        <div 
          className="element-group"
          data-group-id="30"
          onClick={() => onElementClick(30)}
        >
          <p className="text-base mb-2">This is regular body text that shows how the typography system affects content readability.</p>
          <p className="text-sm text-gray-600">This is secondary text with muted styling.</p>
        </div>
        
        <div 
          className="tooltip inline-block px-3 py-1 rounded text-xs element-group"
          data-group-id="24"
          onClick={() => onElementClick(24)}
        >
          Sample Tooltip
        </div>
      </div>
    );

    return commonElements;
  };

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Live Preview</span>
          <Badge variant="outline">{role} view</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedGroup && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">
                Group #{selectedGroup.id}: {selectedGroup.name}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Preview Frame */}
      <div 
        className={`border-2 border-gray-200 rounded-lg overflow-hidden ${
          previewMode === 'mobile' ? 'max-w-sm mx-auto' : 
          previewMode === 'tablet' ? 'max-w-2xl mx-auto' : 
          'w-full'
        }`}
        style={{ 
          minHeight: fullPreview ? '600px' : '400px',
          transition: 'all 0.3s ease'
        }}
      >
        {getMockPageContent()}
      </div>

      {/* Element Group Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Element Groups ({elementGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {elementGroups.map(group => (
              <div
                key={group.id}
                className={`p-2 border rounded text-xs cursor-pointer transition-colors ${
                  selectedGroup?.id === group.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => onElementClick(group.id)}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1">#{group.id}</Badge>
                  <span className="truncate">{group.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}