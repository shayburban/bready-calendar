
import React, { useState, useEffect } from 'react';
import { AdminPricingConfig } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2, HelpCircle, Settings, DollarSign, Search, Clock, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import DualHandleSlider from '../components/common/DualHandleSlider';
import SingleHandleSlider from '../components/common/SingleHandleSlider';
import TabSelector from '../components/common/TabSelector';

const DEFAULT_CONFIG = {
  commissionTiers: [
    { minHours: 0, maxHours: 20, rate: 24 },
    { minHours: 21, maxHours: 50, rate: 22 },
    { minHours: 51, maxHours: null, rate: 20 },
  ],
  trialLesson: {
    adminMinPercentage: 50, // Changed from 0 to 50
    adminMaxPercentage: 100,
    commissionRate: 10,
  },
  packageTiers: [
    { name: 'Small', minHours: 5, maxHours: 9 },
    { name: 'Medium', minHours: 10, maxHours: 19 },
    { name: 'Large', minHours: 20, maxHours: 40 },
  ],
  cancellationPolicy: {
    studentCancellation: {
      maxFreeCancellationDays: 60,
      maxFreeCancellationHours: 23,
      defaultFreeCancellationDays: 10, // Added new default value
    },
  },
  aiSearchLimits: {
    guestUsersPerDay: 4,
    internalUsersPerDay: 6,
    resetWindowHours: 24
  }
};

const ConfigSection = ({ 
  icon: Icon, 
  title, 
  description, 
  location, 
  children, 
  onSave, 
  hasChanges, 
  saving 
}) => (
  <Card className="mb-6">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Used in:</strong> {location}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              📍 {location}
            </Badge>
          </div>
        </div>
        <Button 
          onClick={onSave}
          disabled={!hasChanges || saving}
          size="sm"
          className={`ml-4 ${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'}`}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Section'}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export default function AdminConfigurationManagement() {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSections, setSavingSections] = useState({});
  const [configId, setConfigId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, section: '', changes: [] });
  
  // Tab states for each section
  const [activeCommissionTab, setActiveCommissionTab] = useState(() => localStorage.getItem('adminPricingCommissionTab') || 'tier-1');
  const [activePackageTab, setActivePackageTab] = useState(() => localStorage.getItem('adminPricingPackageTab') || 'small');
  const [activeAILimitTab, setActiveAILimitTab] = useState(() => localStorage.getItem('adminPricingAiLimitTab') || 'guest');

  // NEW: useEffect hooks to save tab state to localStorage on change.
  useEffect(() => {
    localStorage.setItem('adminPricingCommissionTab', activeCommissionTab);
  }, [activeCommissionTab]);

  useEffect(() => {
    localStorage.setItem('adminPricingPackageTab', activePackageTab);
  }, [activePackageTab]);

  useEffect(() => {
    localStorage.setItem('adminPricingAiLimitTab', activeAILimitTab);
  }, [activeAILimitTab]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const configs = await AdminPricingConfig.filter({ isActive: true });
        if (configs.length > 0) {
          const fetchedConfig = configs[0];
          const completeConfig = {
            ...DEFAULT_CONFIG,
            ...fetchedConfig,
            cancellationPolicy: { 
              ...DEFAULT_CONFIG.cancellationPolicy, 
              ...fetchedConfig.cancellationPolicy,
              studentCancellation: {
                ...DEFAULT_CONFIG.cancellationPolicy.studentCancellation,
                ...(fetchedConfig.cancellationPolicy?.studentCancellation || {}),
              }
            },
            aiSearchLimits: { ...DEFAULT_CONFIG.aiSearchLimits, ...fetchedConfig.aiSearchLimits }
          };
          setConfig(completeConfig);
          setOriginalConfig(JSON.parse(JSON.stringify(completeConfig)));
          setConfigId(fetchedConfig.id);
        } else {
          const newConfig = await AdminPricingConfig.create({ 
            ...DEFAULT_CONFIG, 
            config_id: 'platform_config_v1', 
            isActive: true 
          });
          setConfig(newConfig);
          setOriginalConfig(JSON.parse(JSON.stringify(newConfig)));
          setConfigId(newConfig.id);
        }
      } catch (error) {
        console.error("Failed to fetch or create admin configuration:", error);
        setConfig(DEFAULT_CONFIG);
        setOriginalConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Check if section has changes
  const getSectionChanges = (sectionKey) => {
    if (!originalConfig || !config) return [];
    
    const changes = [];
    const original = originalConfig[sectionKey];
    const current = config[sectionKey];
    
    // Deep comparison for nested objects like cancellationPolicy
    if (JSON.stringify(original) !== JSON.stringify(current)) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          if (JSON.stringify(original[index]) !== JSON.stringify(item)) {
            changes.push(`Modified ${sectionKey} item ${index + 1}`);
          }
        });
      } else if (typeof current === 'object' && current !== null) {
        Object.keys(current).forEach(key => {
          // Special handling for cancellationPolicy.studentCancellation
          if (sectionKey === 'cancellationPolicy' && key === 'studentCancellation') {
            const originalStudentCancellation = original[key] || {};
            const currentStudentCancellation = current[key] || {};
            Object.keys(currentStudentCancellation).forEach(subKey => {
              if (originalStudentCancellation[subKey] !== currentStudentCancellation[subKey]) {
                changes.push(`${key}.${subKey}: ${originalStudentCancellation[subKey]} → ${currentStudentCancellation[subKey]}`);
              }
            });
            // Also check for keys removed from current but present in original (though not likely with existing code)
            Object.keys(originalStudentCancellation).forEach(subKey => {
                if (!(subKey in currentStudentCancellation)) {
                    changes.push(`${key}.${subKey}: ${originalStudentCancellation[subKey]} → (removed)`);
                }
            });
          } else if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) { // Compare nested objects
            changes.push(`${key}: ${JSON.stringify(original[key])} → ${JSON.stringify(current[key])}`);
          }
        });
      } else {
        if (original !== current) {
          changes.push(`${sectionKey}: ${original} → ${current}`);
        }
      }
    }
    return changes;
  };

  const handleSectionSave = async (sectionKey, sectionName) => {
    const changes = getSectionChanges(sectionKey);
    setConfirmDialog({ 
      open: true, 
      section: sectionKey,
      sectionName: sectionName,
      changes: changes 
    });
  };

  const confirmSectionSave = async () => {
    const sectionKey = confirmDialog.section;
    setSavingSections(prev => ({ ...prev, [sectionKey]: true }));
    
    try {
      if (configId) {
        await AdminPricingConfig.update(configId, config);
      } else {
        const newConfig = await AdminPricingConfig.create({ 
          ...config, 
          config_id: 'platform_config_v1', 
          isActive: true 
        });
        setConfigId(newConfig.id);
      }
      
      // Update original config to reflect saved state
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      alert(`${confirmDialog.sectionName} configuration saved successfully!`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Error saving configuration. Please try again.');
    } finally {
      setSavingSections(prev => ({ ...prev, [sectionKey]: false }));
      setConfirmDialog({ open: false, section: '', changes: [] });
    }
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...config.commissionTiers];
    updatedTiers[index][field] = field === 'maxHours' && value === '' ? null : value;
    setConfig(prev => ({ ...prev, commissionTiers: updatedTiers }));
  };

  const handlePackageChange = (index, field, value) => {
    const updatedPackages = [...config.packageTiers];
    updatedPackages[index][field] = value;
    setConfig(prev => ({ ...prev, packageTiers: updatedPackages }));
  };

  const handleTrialChange = (field, value) => {
    setConfig(prev => ({ ...prev, trialLesson: { ...prev.trialLesson, [field]: value } }));
  };

  const handleCancellationChange = (field, value) => {
    setConfig(prev => ({ 
      ...prev, 
      cancellationPolicy: { 
        ...prev.cancellationPolicy,
        studentCancellation: {
          ...prev.cancellationPolicy.studentCancellation,
          [field]: value 
        }
      } 
    }));
  };

  const handleAILimitsChange = (field, value) => {
    setConfig(prev => ({ ...prev, aiSearchLimits: { ...prev.aiSearchLimits, [field]: value } }));
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform configuration...</p>
        </div>
      </div>
    );
  }

  // Generate tabs for commission tiers
  const commissionTabs = config.commissionTiers?.map((tier, index) => ({
    label: `Tier ${index + 1} (${index === 0 ? 'New Teachers' : index === config.commissionTiers.length - 1 ? 'Experienced Teachers' : 'Regular Teachers'})`,
    value: `tier-${index + 1}`
  })) || [];

  // Generate tabs for package tiers
  const packageTabs = config.packageTiers?.map((pkg, index) => ({
    label: `${pkg.name} Package`,
    value: pkg.name.toLowerCase()
  })) || [];

  // Generate tabs for AI Search Limits
  const aiLimitTabs = [
    { label: 'Guest Users Daily Limit', value: 'guest' },
    { label: 'Internal Users Daily Limit', value: 'internal' },
    { label: 'Reset Window', value: 'reset' },
  ];

  // Get current tier index
  const currentTierIndex = parseInt(activeCommissionTab.split('-')[1]) - 1;
  const currentTier = config.commissionTiers?.[currentTierIndex];

  // Get current package index
  const currentPackageIndex = config.packageTiers?.findIndex(pkg => pkg.name.toLowerCase() === activePackageTab) || 0;
  const currentPackage = config.packageTiers?.[currentPackageIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Configuration</h1>
              <p className="text-gray-600 mt-1">Manage all dynamic numbers and settings across Bready platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* AI Search Limits Section */}
            <ConfigSection
              icon={Search}
              title="AI Search Limits"
              description="Control how many AI-powered teacher searches users can perform per day"
              location="Find Tutors page > AI Search feature"
              onSave={() => handleSectionSave('aiSearchLimits', 'AI Search Limits')}
              hasChanges={getSectionChanges('aiSearchLimits').length > 0}
              saving={savingSections.aiSearchLimits}
            >
              <div className="mb-8">
                <TabSelector
                  tabs={aiLimitTabs}
                  moreLabel="+X More"
                  activeTab={activeAILimitTab}
                  onTabChange={setActiveAILimitTab}
                  maxVisibleTabs={3}
                />
              </div>
              
              <div className="p-6 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 gap-8">
                  {activeAILimitTab === 'guest' && (
                    <SingleHandleSlider
                      label="Guest Users Daily Limit"
                      value={config.aiSearchLimits?.guestUsersPerDay}
                      onChange={(value) => handleAILimitsChange('guestUsersPerDay', value)}
                      min={0}
                      max={20}
                      suffix="searches"
                      inputLabel="Limit"
                      onReset={() => 4}
                    />
                  )}
                  {activeAILimitTab === 'internal' && (
                    <SingleHandleSlider
                      label="Internal Users Daily Limit"
                      value={config.aiSearchLimits?.internalUsersPerDay}
                      onChange={(value) => handleAILimitsChange('internalUsersPerDay', value)}
                      min={0}
                      max={50}
                      suffix="searches"
                      inputLabel="Limit"
                      onReset={() => 6}
                    />
                  )}
                  {activeAILimitTab === 'reset' && (
                    <SingleHandleSlider
                      label="Reset Window"
                      value={config.aiSearchLimits?.resetWindowHours}
                      onChange={(value) => handleAILimitsChange('resetWindowHours', value)}
                      min={1}
                      max={168}
                      suffix="hours"
                      inputLabel="Hours"
                      onReset={() => 24}
                    />
                  )}
                </div>
              </div>
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Impact:</strong> Higher limits encourage more searches but increase AI costs. 
                  Guest users see upgrade prompts when limits are reached.
                </p>
              </div>
            </ConfigSection>

            <Separator />

            {/* Cancellation Policy Section */}
            <ConfigSection
              icon={Clock}
              title="Cancellation Policy Settings"
              description="Define maximum free cancellation periods and default values for teachers to select."
              location="Teacher Registration Step 5b > Free Cancellation Card"
              onSave={() => handleSectionSave('cancellationPolicy', 'Cancellation Policy')}
              hasChanges={getSectionChanges('cancellationPolicy').length > 0}
              saving={savingSections.cancellationPolicy}
            >
              <div className="p-6 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <SingleHandleSlider
                    label="Max Free Cancellation Days"
                    value={config.cancellationPolicy?.studentCancellation?.maxFreeCancellationDays}
                    onChange={(value) => handleCancellationChange('maxFreeCancellationDays', value)}
                    min={0}
                    max={90}
                    suffix="days"
                    inputLabel="Days"
                    onReset={() => 60}
                  />
                  <SingleHandleSlider
                    label="Max Free Cancellation Hours"
                    value={config.cancellationPolicy?.studentCancellation?.maxFreeCancellationHours}
                    onChange={(value) => handleCancellationChange('maxFreeCancellationHours', value)}
                    min={0}
                    max={23}
                    suffix="hours"
                    inputLabel="Hours"
                    onReset={() => 23}
                  />
                  <SingleHandleSlider
                    label="Default Free Cancellation Days"
                    value={config.cancellationPolicy?.studentCancellation?.defaultFreeCancellationDays}
                    onChange={(value) => handleCancellationChange('defaultFreeCancellationDays', value)}
                    min={0}
                    max={config.cancellationPolicy?.studentCancellation?.maxFreeCancellationDays || 60}
                    suffix="days"
                    inputLabel="Default"
                    onReset={() => 10}
                  />
                </div>
              </div>
            </ConfigSection>

            <Separator />

            {/* Commission Tiers Section */}
            <ConfigSection
              icon={DollarSign}
              title="Teacher Commission Tiers"
              description="Define commission rates based on monthly teaching hours - affects teacher earnings"
              location="Teacher Registration Step 5a > Pricing Cards & Teacher Dashboard"
              onSave={() => handleSectionSave('commissionTiers', 'Commission Tiers')}
              hasChanges={getSectionChanges('commissionTiers').length > 0}
              saving={savingSections.commissionTiers}
            >
              <div className="mb-8">
                <TabSelector
                  tabs={commissionTabs}
                  moreLabel="+X More"
                  activeTab={activeCommissionTab}
                  onTabChange={setActiveCommissionTab}
                  maxVisibleTabs={3}
                />
              </div>
              
              {currentTier && (
                <div className="p-6 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DualHandleSlider
                      label="Teaching Hours Range"
                      value={[currentTier.minHours, currentTier.maxHours || 200]}
                      onChange={(value) => {
                        handleTierChange(currentTierIndex, 'minHours', value[0]);
                        handleTierChange(currentTierIndex, 'maxHours', value[1] === 200 ? null : value[1]);
                      }}
                      min={0}
                      max={200}
                      suffix="hrs/month"
                      leftLabel="Min"
                      rightLabel="Max"
                      onReset={() => [0, 50]}
                    />
                    <SingleHandleSlider
                      label="Commission Rate"
                      value={currentTier.rate}
                      onChange={(value) => handleTierChange(currentTierIndex, 'rate', value)}
                      min={5}
                      max={50}
                      suffix="%"
                      inputLabel="Rate"
                      onReset={() => 24}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    Teachers with {currentTier.minHours}-{currentTier.maxHours || '∞'} monthly hours pay {currentTier.rate}% platform commission
                  </p>
                </div>
              )}
            </ConfigSection>

            <Separator />

            {/* Trial Lesson Section */}
            <ConfigSection
              icon={Clock}
              title="Trial Lesson Configuration"
              description="Control mandatory trial lesson settings for all teachers"
              location="Teacher Registration Step 5a > Trial Lesson Card"
              onSave={() => handleSectionSave('trialLesson', 'Trial Lesson Settings')}
              hasChanges={getSectionChanges('trialLesson').length > 0}
              saving={savingSections.trialLesson}
            >
              <div className="p-6 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <DualHandleSlider
                    label="Teacher Percentage Range"
                    value={[config.trialLesson?.adminMinPercentage, config.trialLesson?.adminMaxPercentage]}
                    onChange={(value) => {
                      handleTrialChange('adminMinPercentage', value[0]);
                      handleTrialChange('adminMaxPercentage', value[1]);
                    }}
                    min={0}
                    max={100}
                    suffix="% of lowest rate"
                    leftLabel="Min"
                    rightLabel="Max"
                    onReset={() => [50, 100]}
                  />
                  <SingleHandleSlider
                    label="Platform Commission"
                    value={config.trialLesson?.commissionRate}
                    onChange={(value) => handleTrialChange('commissionRate', value)}
                    min={0}
                    max={30}
                    suffix="%"
                    inputLabel="Rate"
                    onReset={() => 10}
                  />
                </div>
              </div>
              <div className="mt-6 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>How it works:</strong> Teachers set trial price between {config.trialLesson?.adminMinPercentage}%-{config.trialLesson?.adminMaxPercentage}% of their lowest regular service rate. 
                  Platform takes {config.trialLesson?.commissionRate}% commission on trial lessons.
                </p>
              </div>
            </ConfigSection>

            <Separator />

            {/* Package Tiers Section */}
            <ConfigSection
              icon={DollarSign}
              title="Package Hour Ranges"
              description="Define hour ranges for Small, Medium, and Large lesson packages"
              location="Teacher Registration Step 5a > Package Cards Section"
              onSave={() => handleSectionSave('packageTiers', 'Package Tiers')}
              hasChanges={getSectionChanges('packageTiers').length > 0}
              saving={savingSections.packageTiers}
            >
              <div className="mb-8">
                <TabSelector
                  tabs={packageTabs}
                  moreLabel="+X More"
                  activeTab={activePackageTab}
                  onTabChange={setActivePackageTab}
                  maxVisibleTabs={3}
                />
              </div>
              
              {currentPackage && (
                <div className="p-6 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="h-40 flex flex-col justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Package Name</label>
                        <Input
                          value={currentPackage.name}
                          onChange={(e) => handlePackageChange(currentPackageIndex, 'name', e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                    <DualHandleSlider
                      label="Hour Range"
                      value={[currentPackage.minHours, currentPackage.maxHours]}
                      onChange={(value) => {
                        handlePackageChange(currentPackageIndex, 'minHours', value[0]);
                        handlePackageChange(currentPackageIndex, 'maxHours', value[1]);
                      }}
                      min={1}
                      max={50}
                      suffix="hours"
                      leftLabel="Min"
                      rightLabel="Max"
                      onReset={() => [5, 20]}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    Students can purchase {currentPackage.name.toLowerCase()} packages with {currentPackage.minHours}-{currentPackage.maxHours} lesson hours
                  </p>
                </div>
              )}
              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Usage:</strong> These ranges appear in teacher registration and student booking flow. 
                  Teachers set custom hourly rates for each package tier.
                </p>
              </div>
            </ConfigSection>

          </div>
        </ScrollArea>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Configuration Changes</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  You are about to update the <strong>{confirmDialog.sectionName}</strong> configuration. 
                  This will affect the entire website section immediately.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-sm mb-2">Changes to be applied:</p>
                  <ul className="text-sm space-y-1">
                    {confirmDialog.changes.map((change, index) => (
                      <li key={index} className="text-gray-700">• {change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSectionSave}>
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
