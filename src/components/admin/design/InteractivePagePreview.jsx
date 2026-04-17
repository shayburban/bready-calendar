
import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Edit, 
  AlertTriangle,
  Shield,
  Play,
  Settings
} from 'lucide-react';
import { ROLE_OPTIONS, PAGE_OPTIONS, PAGE_LOADERS } from './constants/previewOptions';


// Dynamic component loading
const loadPageComponent = (pageName) => {
  const loader = PAGE_LOADERS[pageName];
  return React.lazy(() => 
    loader ? loader() : Promise.resolve({ default: () => <div>Page not found</div> })
  );
};

const PreviewControls = ({ onRoleSelect, onPageSelect, onPreviewClick, disabled, selectedRole, selectedPage }) => {
  const availableRoles = ROLE_OPTIONS;

  const availablePages = PAGE_OPTIONS.filter(p => p.previewable);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Interactive Page Preview
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select a role and page to preview the actual live content in sandbox mode
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">View as Role</label>
            <Select value={selectedRole} onValueChange={onRoleSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose role..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Page</label>
            <Select value={selectedPage} onValueChange={onPageSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose page..." />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map(page => (
                  <SelectItem key={page.value} value={page.value}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {selectedRole && (
              <Badge variant="outline">Role: {selectedRole}</Badge>
            )}
            {selectedPage && (
              <Badge variant="outline">Page: {selectedPage}</Badge>
            )}
          </div>
          
          <Button 
            onClick={onPreviewClick} 
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Load Preview
          </Button>
        </div>

        {disabled && (
          <div className="text-sm text-gray-500 text-center py-2">
            Please select both a role and page to enable preview
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PreviewLoader = () => (
  <Card>
    <CardContent className="py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2">Loading Page Preview</h3>
        <p className="text-gray-600">Preparing sandbox environment...</p>
      </div>
    </CardContent>
  </Card>
);

const SandboxOverlay = ({ onEditRequest, role, page }) => (
  <div className="fixed inset-0 z-50 pointer-events-none">
    <div className="absolute top-4 left-4 right-4 pointer-events-auto">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">
            Sandbox Mode - Viewing as {role} on {page} page
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={onEditRequest}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Edit className="w-4 h-4 mr-1" />
            Switch to Edit Mode
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const EditModeOverlay = ({ onExitEdit, role, page }) => (
  <div className="fixed inset-0 z-50 pointer-events-none">
    <div className="absolute top-4 left-4 right-4 pointer-events-auto">
      <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            🚨 EDIT MODE ACTIVE - Changes affect live {page} page for {role} users
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={onExitEdit}
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            Exit Edit Mode
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const OriginalPageWrapper = ({ role, page, mode, onEditRequest, onExitEdit, systemConfig }) => {
  const PageComponent = loadPageComponent(page);
  const isEditMode = mode === 'edit';
  const isSandbox = mode === 'sandbox';

  return (
    <div className={`page-container ${mode}-mode relative`}>
      {/* Apply system design config as CSS variables */}
      <style jsx>{`
        .page-container {
          --color-primary: ${systemConfig?.globalColors?.primary || '#0263c4'};
          --color-secondary: ${systemConfig?.globalColors?.secondary || '#6b7280'};
          --color-background: ${systemConfig?.globalColors?.background || '#ffffff'};
          --color-text: ${systemConfig?.globalColors?.text || '#1f2937'};
          --font-family: ${systemConfig?.typography?.fontFamily || 'Inter, sans-serif'};
          --button-border-radius: ${systemConfig?.components?.buttons?.borderRadius || '6px'};
          --input-border-radius: ${systemConfig?.components?.inputs?.borderRadius || '6px'};
          --card-border-radius: ${systemConfig?.components?.cards?.borderRadius || '8px'};
        }
      `}</style>

      {/* Render original page content */}
      <div className={`min-h-screen ${isSandbox ? 'pointer-events-none' : ''}`}>
        <Suspense fallback={<PreviewLoader />}>
          <PageComponent role={role} editable={isEditMode} />
        </Suspense>
      </div>
      
      {/* Conditional overlays */}
      {isSandbox && (
        <SandboxOverlay 
          onEditRequest={onEditRequest} 
          role={role} 
          page={page} 
        />
      )}
      
      {isEditMode && (
        <EditModeOverlay 
          onExitEdit={onExitEdit} 
          role={role} 
          page={page} 
        />
      )}
    </div>
  );
};

export default function InteractivePagePreview({
  systemConfig,
  onEditModeChange,
  selectedRole,
  setSelectedRole,
  selectedPage,
  setSelectedPage
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('sandbox'); // 'sandbox' or 'edit'

  const handlePreviewClick = () => {
    if (selectedRole && selectedPage) {
      setShowPreview(true);
      setPreviewMode('sandbox');
    }
  };

  const handleEditModeRequest = () => {
    // First alert - Intent confirmation
    const firstConfirm = window.confirm(
      "⚠️ EDIT MODE WARNING\n\n" +
      "You are about to switch to edit mode. This will allow you to modify the actual live page content.\n\n" +
      `Selected Page: ${selectedPage}\n` +
      `Selected Role: ${selectedRole}\n\n` +
      "Do you want to continue?"
    );
    
    if (!firstConfirm) return;
    
    // Second alert - Final warning
    const secondConfirm = window.confirm(
      "🚨 FINAL WARNING\n\n" +
      "Changes made in edit mode will DIRECTLY affect the live page that users see. " +
      "This action cannot be undone automatically.\n\n" +
      "Your changes will immediately impact:\n" +
      `• All ${selectedRole} users viewing the ${selectedPage} page\n` +
      "• Live website functionality\n" +
      "• User experience across the platform\n\n" +
      "Are you absolutely sure you want to proceed with editing?"
    );
    
    if (secondConfirm) {
      setPreviewMode('edit');
      
      // Log admin action for audit trail
      console.log('ADMIN_ACTION: EDIT_MODE_ACTIVATED', {
        role: selectedRole,
        page: selectedPage,
        timestamp: new Date().toISOString(),
        userId: 'admin' // Replace with actual admin user ID
      });

      // Notify parent component about edit mode change
      if (onEditModeChange) {
        onEditModeChange(true, { role: selectedRole, page: selectedPage });
      }
    }
  };

  const handleExitEdit = () => {
    const confirm = window.confirm(
      "Exit Edit Mode?\n\n" +
      "You will return to safe sandbox mode where no changes can be made to the live website.\n\n" +
      "Continue?"
    );
    
    if (confirm) {
      setPreviewMode('sandbox');
      
      // Log admin action
      console.log('ADMIN_ACTION: EDIT_MODE_DEACTIVATED', {
        role: selectedRole,
        page: selectedPage,
        timestamp: new Date().toISOString(),
        userId: 'admin'
      });

      // Notify parent component
      if (onEditModeChange) {
        onEditModeChange(false, { role: selectedRole, page: selectedPage });
      }
    }
  };

  const handleBackToControls = () => {
    if (previewMode === 'edit') {
      const confirm = window.confirm(
        "You are currently in Edit Mode. Returning to controls will exit edit mode.\n\n" +
        "Continue?"
      );
      if (!confirm) return;
    }
    
    setShowPreview(false);
    setPreviewMode('sandbox');
    // We don't reset the selection here anymore, as it's controlled by the parent.
    
    if (onEditModeChange) {
      onEditModeChange(false, null);
    }
  };

  return (
    <div className="interactive-preview space-y-6">
      {!showPreview ? (
        <PreviewControls 
          onRoleSelect={setSelectedRole}
          onPageSelect={setSelectedPage}  
          onPreviewClick={handlePreviewClick}
          disabled={!selectedRole || !selectedPage}
          selectedRole={selectedRole}
          selectedPage={selectedPage}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleBackToControls}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Back to Controls
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge 
                  className={previewMode === 'edit' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                >
                  {previewMode === 'edit' ? '🚨 Edit Mode' : '🛡️ Sandbox Mode'}
                </Badge>
                <Badge variant="outline">
                  {selectedRole} viewing {selectedPage}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Monitor className="w-4 h-4" />
                Desktop
              </Button>
              <Button variant="outline" size="sm">
                <Tablet className="w-4 h-4" />
                Tablet
              </Button>
              <Button variant="outline" size="sm">
                <Smartphone className="w-4 h-4" />
                Mobile
              </Button>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
            <OriginalPageWrapper
                role={selectedRole}
                page={selectedPage}
                mode={previewMode}
                onEditRequest={handleEditModeRequest}
                onExitEdit={handleExitEdit}
                systemConfig={systemConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
}
