
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { SystemDesignConfig } from '@/api/entities';
import { DesignOverride } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  Type,
  Square,
  Layers,
  Save,
  Plus,
  Trash2,
  Eye,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Shield,
  RefreshCw,
  Code,
  Paintbrush,
  Grid,
  AlertTriangle
} from 'lucide-react';
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
import TabSelector from '../components/common/TabSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PreviewFrame from '../components/admin/design/PreviewFrame';
import ElementGroupEditor from '../components/admin/design/ElementGroupEditor';
import InteractivePagePreview from '../components/admin/design/InteractivePagePreview';
import { ROLE_OPTIONS, PAGE_OPTIONS } from '../components/admin/design/constants/previewOptions';

export default function AdminSystemDesign() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // MODIFIED: Initialize state from localStorage to persist active tab
  // across re-mounts and page reloads. Wrapped in a function for SSR safety
  // and to ensure localStorage is only read once on initial render.
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') {
      return 'global-design';
    }
    return localStorage.getItem('adminDesignActiveTab') || 'global-design';
  });

  const [showPreview, setShowPreview] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', data: null });

  // NEW STATE FOR EDIT MODE
  const [editModeActive, setEditModeActive] = useState(false);
  const [editModeContext, setEditModeContext] = useState(null);

  // System Design Config State
  const [systemConfig, setSystemConfig] = useState({
    globalColors: {
      primary: '#0263c4',
      secondary: '#6b7280',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#1f2937',
      textSecondary: '#6b7280'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingScale: 1.25,
      baseSize: '14px',
      lineHeight: 1.6,
      fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    spacing: {
      baseUnit: '4px',
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]
    },
    components: {
      buttons: {
        borderRadius: '6px',
        paddingX: '16px',
        paddingY: '8px',
        fontSize: '14px',
        fontWeight: 500,
        variants: {
          primary: { bg: '#0263c4', color: '#ffffff', border: 'none' },
          secondary: { bg: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
          outline: { bg: 'transparent', color: '#374151', border: '1px solid #d1d5db' }
        },
        // NEW: Button active and inactive states
        activeState: {
          backgroundColor: '#014a9c', // A darker shade of primary for active
          textColor: '#ffffff',
          borderColor: 'none',
        },
        inactiveState: {
          backgroundColor: '#e5e7eb', // Light gray for disabled
          textColor: '#9ca3af', // Darker gray for text
          borderColor: 'none',
          opacity: 0.6, // Default opacity for disabled
        }
      },
      inputs: {
        borderRadius: '6px',
        padding: '12px',
        fontSize: '14px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        placeholderColor: '#9ca3af',
        focusBorder: '#3b82f6',
        focusShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
      },
      dropdowns: {
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        itemTextColor: '#1f2937',
        itemHoverBackgroundColor: '#f3f4f6',
        itemSelectedBackgroundColor: '#dbeafe',
        itemSelectedTextColor: '#1e40af',
      },
      tooltips: {
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '12px'
      },
      cards: {
        borderRadius: '8px',
        padding: '24px',
        shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }
    },
    responsive: {
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      }
    }
  });

  // Design Overrides State
  const [designOverrides, setDesignOverrides] = useState([]);
  const [newOverride, setNewOverride] = useState({
    targetElement: '',
    targetPage: '',
    targetRole: '',
    property: '',
    value: '',
    condition: '',
    description: ''
  });

  // LIFTED STATE: Centralized state for all previews
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPage, setSelectedPage] = useState('');

  const [selectedElementGroup, setSelectedElementGroup] = useState(null);
  const [elementGroups, setElementGroups] = useState([
    // Forms & Inputs
    { id: 1, name: 'Input Fields', selector: 'input, .custom-input', description: 'All text input fields', category: 'forms' },
    { id: 2, name: 'Dropdown Menus', selector: 'select, .dropdown-trigger', description: 'All dropdown selection menus', category: 'forms' },
    { id: 3, name: 'Checkboxes', selector: 'input[type="checkbox"], .checkbox', description: 'Checkbox form controls', category: 'forms' },
    { id: 4, name: 'Radio Buttons', selector: 'input[type="radio"], .radio', description: 'Radio button form controls', category: 'forms' },
    { id: 5, name: 'Text Areas', selector: 'textarea, .textarea', description: 'Multi-line text input fields', category: 'forms' },
    { id: 6, name: 'Sliders', selector: '.slider, [role="slider"]', description: 'Range slider components', category: 'forms' },

    // Buttons & Actions
    { id: 7, name: 'Primary Buttons', selector: '.btn-primary, button[type="submit"]', description: 'Main action buttons', category: 'buttons' },
    { id: 8, name: 'Secondary Buttons', selector: '.btn-secondary, .btn-outline', description: 'Secondary action buttons', category: 'buttons' },
    { id: 9, name: 'Icon Buttons', selector: '.btn-icon, button[aria-label]', description: 'Icon-only buttons', category: 'buttons' },
    { id: 10, name: 'Link Buttons', selector: '.btn-link, a.btn', description: 'Text-based link buttons', category: 'buttons' },
    { id: 11, name: 'Floating Action Buttons', selector: '.btn-fab, .floating-btn', description: 'Floating action buttons', category: 'buttons' },

    // Navigation & Layout
    { id: 12, name: 'Header Navigation', selector: 'header, .header, nav', description: 'Main website header and navigation', category: 'navigation' },
    { id: 13, name: 'Footer', selector: 'footer, .footer', description: 'Website footer area', category: 'navigation' },
    { id: 14, name: 'Sidebar', selector: '.sidebar, aside', description: 'Side navigation panels', category: 'navigation' },
    { id: 15, name: 'Breadcrumbs', selector: '.breadcrumb, .breadcrumbs', description: 'Navigation breadcrumb trails', category: 'navigation' },
    { id: 16, name: 'Tabs', selector: '.tab, .tabs, [role="tab"]', description: 'Tab navigation components', category: 'navigation' },
    { id: 17, name: 'Pagination', selector: '.pagination, .page-nav', description: 'Page navigation controls', category: 'navigation' },

    // Content & Layout
    { id: 18, name: 'Cards', selector: '.card, .bg-white', description: 'Content containers and cards', category: 'layout' },
    { id: 19, name: 'Modals', selector: '.modal, .dialog, [role="dialog"]', description: 'Modal dialog boxes', category: 'layout' },
    { id: 20, name: 'Popover/Dropdown', selector: '.popover, .dropdown-content', description: 'Popover and dropdown content', category: 'layout' },
    { id: 21, name: 'Accordion', selector: '.accordion, .collapsible', description: 'Expandable content sections', category: 'layout' },
    { id: 22, name: 'Grid Containers', selector: '.grid, .grid-container', description: 'Grid layout containers', category: 'layout' },
    { id: 23, name: 'Sections', selector: 'section, .section', description: 'Page section containers', category: 'layout' },

    // Feedback & Status
    { id: 24, name: 'Tooltips', selector: '.tooltip, [data-tooltip]', description: 'Hover information tooltips', category: 'feedback' },
    { id: 25, name: 'Alerts', selector: '.alert, .notification', description: 'Alert and notification messages', category: 'feedback' },
    { id: 26, name: 'Badges', selector: '.badge, .tag', description: 'Status badges and tags', category: 'feedback' },
    { id: 27, name: 'Progress Bars', selector: '.progress, .progress-bar', description: 'Progress indication bars', category: 'feedback' },
    { id: 28, name: 'Loading Spinners', selector: '.spinner, .loading', description: 'Loading state indicators', category: 'feedback' },

    // Typography
    { id: 29, name: 'Text Headers', selector: 'h1, h2, h3, .heading', description: 'Page titles and headings', category: 'typography' },
    { id: 30, name: 'Body Text', selector: 'p, .text-body', description: 'Regular content text', category: 'typography' },
    { id: 31, name: 'Links', selector: 'a, .link', description: 'Text links and anchors', category: 'typography' },
    { id: 32, name: 'Labels', selector: 'label, .label', description: 'Form field labels', category: 'typography' },
    { id: 33, name: 'Captions', selector: '.caption, .text-small', description: 'Small descriptive text', category: 'typography' },

    // Data Display
    { id: 34, name: 'Tables', selector: 'table, .table', description: 'Data tables and grids', category: 'data' },
    { id: 35, name: 'Lists', selector: 'ul, ol, .list', description: 'Ordered and unordered lists', category: 'data' },
    { id: 36, name: 'Profile Cards', selector: '.profile-card, .teacher-card', description: 'User profile display cards', category: 'data' },
    { id: 37, name: 'Statistics Cards', selector: '.stat-card, .metric-card', description: 'Metric and statistic displays', category: 'data' },

    // Specialized Components
    { id: 38, name: 'Calendar Components', selector: '.calendar, .date-picker', description: 'Calendar and date selection', category: 'specialized' },
    { id: 39, name: 'Chat/Message', selector: '.chat, .message', description: 'Chat and messaging interfaces', category: 'specialized' },
    { id: 40, name: 'Video Player', selector: '.video-player, video', description: 'Video playback controls', category: 'specialized' },
    { id: 41, name: 'Search Components', selector: '.search, .search-bar', description: 'Search input and results', category: 'specialized' },
    { id: 42, name: 'Filter Panels', selector: '.filter, .filter-panel', description: 'Content filtering interfaces', category: 'specialized' },

    // Admin Specific
    { id: 43, name: 'Admin Panels', selector: '.admin-panel, .dashboard-card', description: 'Admin dashboard components', category: 'admin' },
    { id: 44, name: 'Form Sections', selector: '.form-section, .form-group', description: 'Grouped form sections', category: 'admin' },
    { id: 45, name: 'Data Tables', selector: '.data-table, .admin-table', description: 'Admin data management tables', category: 'admin' },

    // Mobile Specific
    { id: 46, name: 'Mobile Menu', selector: '.mobile-menu, .hamburger-menu', description: 'Mobile navigation menus', category: 'mobile' },
    { id: 47, name: 'Mobile Cards', selector: '.mobile-card, .card-mobile', description: 'Mobile-optimized cards', category: 'mobile' },
    { id: 48, name: 'Mobile Buttons', selector: '.mobile-btn, .btn-mobile', description: 'Mobile-sized buttons', category: 'mobile' },

    // COMMON COMPONENTS - NEW CATEGORY
    { id: 49, name: 'Tab Selector', selector: '.tab-selector, [data-tab-selector]', description: 'TabSelector component from components/common/', category: 'common' },
    { id: 50, name: 'Global Admin Banner', selector: '.admin-banner, .global-admin-banner', description: 'GlobalAdminBanner component', category: 'common' },
    { id: 51, name: 'Progress Bar', selector: '.progress-bar, .common-progress', description: 'ProgressBar component from common/', category: 'common' },
    { id: 52, name: 'Pagination', selector: '.pagination, .common-pagination', description: 'Pagination component from common/', category: 'common' },
    { id: 53, name: 'Input Components', selector: '.custom-input, .global-input', description: 'Custom Input components from common/', category: 'common' },
    { id: 54, name: 'Searchable Dropdown', selector: '.searchable-dropdown', description: 'SearchableDropdownField component', category: 'common' },
    { id: 55, name: 'Country Tab Selector', selector: '.country-tab-selector', description: 'CountryTabSelector component', category: 'common' },
    { id: 56, name: 'Multi Language Selector', selector: '.multi-language-selector', description: 'GlobalMultiLanguageSelector component', category: 'common' },
    { id: 57, name: 'Custom Dropdown Selector', selector: '.custom-dropdown-selector', description: 'GlobalCustomDropdownSelector component', category: 'common' },
    { id: 58, name: 'Date Range Picker', selector: '.date-range-picker', description: 'DateRangePicker component from common/', category: 'common' },
    { id: 59, name: 'Time Input', selector: '.custom-time-input', description: 'CustomTimeInput component', category: 'common' },
    { id: 60, name: 'Availability Window', selector: '.availability-window', description: 'AvailabilityWindow component', category: 'common' },
    { id: 61, name: 'Advance Booking Selector', selector: '.advance-booking-selector', description: 'AdvanceBookingSelector component', category: 'common' },
    { id: 62, name: 'Break Time Selector', selector: '.break-time-selector', description: 'BreakTimeSelector component', category: 'common' },
    { id: 63, name: 'Dual Handle Slider', selector: '.dual-handle-slider', description: 'DualHandleSlider component from common/', category: 'common' },
    { id: 64, name: 'Single Handle Slider', selector: '.single-handle-slider', description: 'SingleHandleSlider component from common/', category: 'common' },
    { id: 65, name: 'Overflow Tag Display', selector: '.overflow-tag-display', description: 'OverflowTagDisplay component', category: 'common' },
    { id: 66, name: 'Selectable Country Tags', selector: '.selectable-country-tags', description: 'SelectableCountryTags component', category: 'common' },
    { id: 67, name: 'IP Country Detection', selector: '.ip-country-detection', description: 'IPCountryDetection component', category: 'common' },
    { id: 68, name: 'Dynamic Timezone', selector: '.dynamic-timezone', description: 'DynamicTimezone component', category: 'common' },
    { id: 69, name: 'Custom City Input', selector: '.custom-city-input', description: 'CustomCityInput component', category: 'common' },
    { id: 70, name: 'Teacher Calendar Availability', selector: '.teacher-calendar-availability', description: 'TeacherSetCalendarAvailability component', category: 'common' },
    { id: 71, name: 'Time Slot Row', selector: '.time-slot-row', description: 'TimeSlotRow component from common/', category: 'common' },
    { id: 72, name: 'Day Schedule Row', selector: '.day-schedule-row', description: 'DayScheduleRow component', category: 'common' }
  ]);
  const [draftMode, setDraftMode] = useState(true);
  const [changeHistory, setChangeHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [changeSummary, setChangeSummary] = useState({ groups: [], pages: [] });

  const availablePages = PAGE_OPTIONS.map(({value, label}) => ({value, label}));
  const availableRoles = ROLE_OPTIONS.map(({value, label}) => ({value, label}));
  
  // NEW: A useEffect hook that saves the active tab to localStorage
  // whenever it changes.
  useEffect(() => {
    localStorage.setItem('adminDesignActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin' && !(currentUser.roles && currentUser.roles.includes('admin'))) {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
        await loadSystemConfig();
        await loadDesignOverrides();
      } catch (e) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // NEW: Mock mapping of element groups to the pages they are used on.
  // This elementPageUsage map needs to use the normalized keys from the constants file.
  // 'TeacherSearch' -> 'FindTutors'
  // 'All Pages - Global' -> 'AllPagesGlobal'
  const elementPageUsage = {
    1: ['TeacherRegistration', 'FindTutors', 'Home'], // Input Fields
    2: ['TeacherRegistration', 'FindTutors'], // Dropdown Menus
    7: ['Home', 'TeacherRegistration', 'FindTutors', 'AdminDashboard', 'TeacherCalendar'], // Primary Buttons
    8: ['Home', 'TeacherRegistration', 'AdminSystemDesign'], // Secondary Buttons
    12: ['Home', 'FindTutors', 'TeacherRegistration', 'AdminDashboard'], // Header
    18: ['Home', 'AdminDashboard', 'TeacherRegistration', 'AdminSystemDesign'], // Cards
    26: ['AdminSystemDesign', 'TeacherRegistration', 'FindTutors'], // Badges
    29: ['Home', 'FindTutors', 'TeacherRegistration', 'AdminDashboard'], // Text Headers
    30: ['Home', 'TeacherRegistration', 'AdminSystemDesign'], // Body Text
    36: ['FindTutors', 'Home'], // Profile Cards
    43: ['AdminDashboard', 'AdminSystemDesign'], // Admin Panels

    // COMMON COMPONENTS USAGE MAPPING - Keys must match constants
    49: ['AdminSystemDesign', 'AdminDashboard', 'AdminRoleManagement', 'AdminAnalytics'], // Tab Selector
    50: ['AllPagesGlobal'], // Global Admin Banner
    51: ['TeacherRegistration', 'AdminDashboard'], // Progress Bar
    52: ['FindTutors', 'AdminDashboard'], // Pagination (was TeacherSearch, simplified)
    53: ['TeacherRegistration', 'FindTutors', 'Home', 'AdminDashboard'], // Input Components
    54: ['TeacherRegistration', 'AdminDashboard'], // Searchable Dropdown
    55: ['TeacherRegistration'], // Country Tab Selector
    56: ['TeacherRegistration'], // Multi Language Selector
    57: ['TeacherRegistration', 'AdminDashboard'], // Custom Dropdown Selector
    58: ['AdminAnalytics', 'TeacherCalendar'], // Date Range Picker
    59: ['TeacherRegistration', 'TeacherCalendar'], // Time Input
    60: ['TeacherRegistration', 'TeacherCalendar'], // Availability Window
    61: ['TeacherRegistration', 'TeacherCalendar'], // Advance Booking Selector
    62: ['TeacherRegistration', 'TeacherCalendar'], // Break Time Selector
    63: ['AdminPricingManagement', 'TeacherRegistration'], // Dual Handle Slider
    64: ['AdminPricingManagement', 'TeacherRegistration'], // Single Handle Slider
    65: ['TeacherRegistration', 'FindTutors'], // Overflow Tag Display
    66: ['TeacherRegistration'], // Selectable Country Tags
    67: ['TeacherRegistration'], // IP Country Detection
    68: ['TeacherRegistration', 'TeacherCalendar'], // Dynamic Timezone
    69: ['TeacherRegistration'], // Custom City Input
    70: ['TeacherRegistration', 'TeacherCalendar'], // Teacher Calendar Availability
    71: ['TeacherRegistration', 'TeacherCalendar'], // Time Slot Row
    72: ['TeacherRegistration', 'TeacherCalendar'] // Day Schedule Row
  };

  const designTabs = [
    {
      label: 'Global Design',
      value: 'global-design',
      icon: <Palette className="w-4 h-4" />,
    },
    {
      label: 'Components',
      value: 'components',
      icon: <Square className="w-4 h-4" />,
    },
    {
      label: 'Typography',
      value: 'typography',
      icon: <Type className="w-4 h-4" />,
    },
    {
      label: 'Global Components',
      value: 'global-components',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      label: 'Overrides',
      value: 'overrides',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      label: 'Preview',
      value: 'preview',
      icon: <Eye className="w-4 h-4" />,
    }
  ];

  // NEW FUNCTION FOR EDIT MODE
  const handleEditModeChange = (isActive, context) => {
    setEditModeActive(isActive);
    setEditModeContext(context);
  };

  const loadSystemConfig = async () => {
    try {
      const configs = await SystemDesignConfig.filter({ isActive: true });
      if (configs.length > 0) {
        // Merge existing config with loaded config to preserve defaults for new fields
        setSystemConfig(prevConfig => {
          // Deep merge components to ensure new nested properties are not lost
          const loadedConfig = configs[0].config;
          return {
            ...prevConfig,
            ...loadedConfig,
            components: {
              ...prevConfig.components,
              ...loadedConfig.components,
              inputs: { ...prevConfig.components.inputs, ...loadedConfig.components.inputs },
              dropdowns: { ...prevConfig.components.dropdowns, ...loadedConfig.components.dropdowns },
              tooltips: { ...prevConfig.components.tooltips, ...loadedConfig.components.tooltips },
              buttons: {
                ...prevConfig.components.buttons,
                ...loadedConfig.components.buttons,
                variants: {
                  ...prevConfig.components.buttons.variants,
                  ...loadedConfig.components.buttons.variants
                },
                // NEW: Merge activeState and inactiveState
                activeState: { ...prevConfig.components.buttons.activeState, ...(loadedConfig.components.buttons?.activeState || {}) },
                inactiveState: { ...prevConfig.components.buttons.inactiveState, ...(loadedConfig.components.buttons?.inactiveState || {}) }
              },
              cards: { ...prevConfig.components.cards, ...loadedConfig.components.cards },
            }
          };
        });
      }
    } catch (error) {
      console.error('Failed to load system config:', error);
    }
  };

  const loadDesignOverrides = async () => {
    try {
      const overrides = await DesignOverride.filter({ isActive: true });
      setDesignOverrides(overrides);
    } catch (error) {
      console.error('Failed to load design overrides:', error);
    }
  };

  const confirmAndSave = async () => {
    setSaving(true);
    try {
      // Deactivate existing configs
      const existingConfigs = await SystemDesignConfig.list();
      for (const config of existingConfigs) {
        await SystemDesignConfig.update(config.id, { isActive: false });
      }

      // Create new config
      await SystemDesignConfig.create({
        configName: `System Design ${new Date().toISOString()}`,
        config: systemConfig,
        isActive: true,
        createdBy: user.id
      });

      setChangeHistory([]); // Clear history after successful save
      setHistoryIndex(-1);

      setConfirmDialog({
        open: true,
        action: 'System design configuration saved successfully!',
        data: null
      });
    } catch (error) {
      console.error('Failed to save system config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
      setShowSaveConfirm(false);
    }
  };

  const handleSaveSystemConfig = () => {
    if (changeHistory.length === 0) {
      alert("No changes have been made to save.");
      return;
    }

    const changedGroupIds = [...new Set(changeHistory.map(c => c.groupId))];
    const changedGroups = changedGroupIds.map(id => elementGroups.find(g => g.id === id)?.name).filter(Boolean);
    const affectedPages = [...new Set(changedGroupIds.flatMap(id => elementPageUsage[id] || []))];

    setChangeSummary({ groups: changedGroups, pages: affectedPages });
    setShowSaveConfirm(true);
  };

  const handleAddOverride = async () => {
    if (!newOverride.targetElement || !newOverride.property || !newOverride.value) {
      alert('Please fill in target element, property, and value fields.');
      return;
    }

    try {
      await DesignOverride.create({
        ...newOverride,
        isActive: true,
        createdBy: user.id
      });

      setNewOverride({
        targetElement: '',
        targetPage: '',
        targetRole: '',
        property: '',
        value: '',
        condition: '',
        description: ''
      });

      await loadDesignOverrides();
    } catch (error) {
      console.error('Failed to add override:', error);
      alert('Failed to add override. Please try again.');
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    try {
      await DesignOverride.update(overrideId, { isActive: false });
      await loadDesignOverrides();
    } catch (error) {
      console.error('Failed to delete override:', error);
      alert('Failed to delete override. Please try again.');
    }
  };

  const updateSystemConfig = (path, value) => {
    const pathArray = path.split('.');
    const newConfig = { ...systemConfig };
    let current = newConfig;

    for (let i = 0; i < pathArray.length - 1; i++) {
      if (typeof current[pathArray[i]] !== 'object' || current[pathArray[i]] === null) {
        current[pathArray[i]] = {}; // Initialize if path doesn't exist
      }
      current = current[pathArray[i]];
    }

    current[pathArray[pathArray.length - 1]] = value;
    setSystemConfig(newConfig);
  };

  const handleElementClick = (groupId) => {
    const group = elementGroups.find(g => g.id === groupId);
    setSelectedElementGroup(group);
  };

  const handleGroupStyleChange = (groupId, property, value) => {
    // Save to change history for undo/redo
    const newChange = {
      timestamp: Date.now(),
      groupId,
      property,
      oldValue: getGroupCurrentValue(groupId, property),
      newValue: value
    };

    setChangeHistory(prev => [...prev.slice(0, historyIndex + 1), newChange]);
    setHistoryIndex(prev => prev + 1);

    // Apply the change to system config
    applyGroupChange(groupId, property, value);
  };

  const getGroupCurrentValue = (groupId, property) => {
    // Extended mapping for all component groups
    const groupMappings = {
      1: 'components.inputs', // Input Fields
      2: 'components.dropdowns', // Dropdown Menus
      3: 'components.buttons.variants.primary', // Checkboxes (WARNING: Mapped to button variant due to outline, this is likely incorrect)
      4: 'components.buttons.variants.secondary', // Radio Buttons (WARNING: Mapped to button variant due to outline, this is likely incorrect)
      5: 'components.cards', // Text Areas (WARNING: Mapped to cards due to outline, this is likely incorrect)
      6: 'components.tooltips', // Sliders (WARNING: Mapped to tooltips due to outline, this is likely incorrect)
      7: 'typography', // Primary Buttons (WARNING: Mapped to typography due to outline, this is likely incorrect)
      8: 'typography', // Secondary Buttons (WARNING: Mapped to typography due to outline, this is likely incorrect)
      24: 'components.tooltips', // Tooltips
      29: 'typography', // Text Headers
      30: 'typography', // Body Text
    };

    const configPath = groupMappings[groupId];
    if (!configPath) return '';

    const pathArray = configPath.split('.');
    let value = systemConfig;
    for (const key of pathArray) {
      if (!value || typeof value !== 'object') return '';
      value = value[key];
    }

    // Special handling for typography properties if they map differently
    if (configPath === 'typography' && (property === 'fontFamily' || property === 'baseSize' || property === 'lineHeight' || property === 'headingScale')) {
      return systemConfig.typography[property] || '';
    }

    return value[property] || '';
  };

  const applyGroupChange = (groupId, property, value) => {
    const groupMappings = {
      1: 'components.inputs',
      2: 'components.dropdowns',
      3: 'components.buttons.variants.primary', // Checkboxes (WARNING: Mapped to button variant due to outline, this is likely incorrect)
      4: 'components.buttons.variants.secondary', // Radio Buttons (WARNING: Mapped to button variant due to outline, this is likely incorrect)
      5: 'components.cards', // Text Areas (WARNING: Mapped to cards due to outline, this is likely incorrect)
      6: 'components.tooltips', // Sliders (WARNING: Mapped to tooltips due to outline, this is likely incorrect)
      7: 'typography', // Primary Buttons (WARNING: Mapped to typography due to outline, this is likely incorrect)
      8: 'typography', // Secondary Buttons (WARNING: Mapped to typography due to outline, this is likely incorrect)
      24: 'components.tooltips',
      29: 'typography',
      30: 'typography'
    };

    const configPath = groupMappings[groupId];
    if (configPath) {
      updateSystemConfig(`${configPath}.${property}`, value);
    }
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const change = changeHistory[historyIndex];
      applyGroupChange(change.groupId, change.property, change.oldValue);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < changeHistory.length - 1) {
      const change = changeHistory[historyIndex + 1];
      applyGroupChange(change.groupId, change.property, change.newValue);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const applyPresetTemplate = (templateName) => {
    const templates = {
      'light': {
        globalColors: {
          ...systemConfig.globalColors,
          background: '#ffffff',
          text: '#1f2937',
          surface: '#f9fafb'
        },
        components: {
          ...systemConfig.components,
          cards: { ...systemConfig.components.cards, shadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' },
          buttons: {
            ...systemConfig.components.buttons,
            variants: {
              ...systemConfig.components.buttons.variants,
              primary: { bg: '#0263c4', color: '#ffffff', border: 'none' },
              secondary: { bg: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
              outline: { bg: 'transparent', color: '#374151', border: '1px solid #d1d5db' } // Preserve outline variant
            },
            // Apply light theme specifics for active/inactive
            activeState: {
              backgroundColor: '#014a9c',
              textColor: '#ffffff',
              borderColor: 'none'
            },
            inactiveState: {
              backgroundColor: '#e5e7eb',
              textColor: '#9ca3af',
              borderColor: 'none',
              opacity: 0.6
            }
          },
          inputs: { ...systemConfig.components.inputs, backgroundColor: '#ffffff', textColor: '#1f2937', borderColor: '#d1d5db' },
          dropdowns: { ...systemConfig.components.dropdowns, backgroundColor: '#ffffff', borderColor: '#d1d5db' },
          tooltips: { ...systemConfig.components.tooltips, backgroundColor: '#1f2937', textColor: '#ffffff' }
        }
      },
      'dark': {
        globalColors: {
          ...systemConfig.globalColors,
          background: '#1f2937',
          text: '#ffffff',
          surface: '#374151'
        },
        components: {
          ...systemConfig.components,
          cards: { ...systemConfig.components.cards, shadow: '0 4px 6px rgba(0, 0, 0, 0.2)', border: '1px solid #4b5563' },
          buttons: {
            ...systemConfig.components.buttons,
            variants: {
              ...systemConfig.components.buttons.variants,
              primary: { bg: '#3b82f6', color: '#ffffff', border: 'none' },
              secondary: { bg: '#4b5563', color: '#ffffff', border: '1px solid #6b7280' },
              outline: { bg: 'transparent', color: '#ffffff', border: '1px solid #6b7280' } // Preserve outline variant, adjust colors
            },
            // Apply dark theme specifics for active/inactive
            activeState: {
              backgroundColor: '#2563eb', // Darker blue for active
              textColor: '#ffffff',
              borderColor: 'none'
            },
            inactiveState: {
              backgroundColor: '#4b5563',
              textColor: '#9ca3af',
              borderColor: 'none',
              opacity: 0.5
            }
          },
          inputs: { ...systemConfig.components.inputs, backgroundColor: '#4b5563', textColor: '#ffffff', borderColor: '#6b7280' },
          dropdowns: { ...systemConfig.components.dropdowns, backgroundColor: '#4b5563', borderColor: '#6b7280' },
          tooltips: { ...systemConfig.components.tooltips, backgroundColor: '#e5e7eb', textColor: '#1f2937' }
        }
      },
      'minimalist': {
        globalColors: {
          ...systemConfig.globalColors,
          primary: '#000000',
          accent: '#666666',
          background: '#f8f8f8',
          text: '#333333',
          surface: '#ffffff'
        },
        components: {
          ...systemConfig.components,
          buttons: {
            ...systemConfig.components.buttons,
            borderRadius: '2px',
            paddingX: '12px',
            paddingY: '6px',
            variants: { // Ensure variants are explicitly merged/set
              ...systemConfig.components.buttons.variants,
              primary: { bg: '#000000', color: '#ffffff', border: 'none' },
              secondary: { bg: '#ffffff', color: '#333333', border: '1px solid #cccccc' },
              outline: { bg: 'transparent', color: '#333333', border: '1px solid #cccccc' } // Default for minimalist outline
            },
            // Apply minimalist specifics for active/inactive
            activeState: {
              backgroundColor: '#333333',
              textColor: '#ffffff',
              borderColor: 'none'
            },
            inactiveState: {
              backgroundColor: '#cccccc',
              textColor: '#666666',
              borderColor: 'none',
              opacity: 0.7
            }
          },
          inputs: { ...systemConfig.components.inputs, borderRadius: '2px', border: '1px solid #cccccc', focusBorder: '#000000' },
          dropdowns: { ...systemConfig.components.dropdowns, borderRadius: '2px', borderColor: '#cccccc' },
          cards: { ...systemConfig.components.cards, borderRadius: '4px', shadow: 'none', border: '1px solid #e0e0e0' }
        }
      }
    };

    if (templates[templateName]) {
      setSystemConfig(prev => ({
        ...prev,
        globalColors: templates[templateName].globalColors,
        components: templates[templateName].components
      }));
    }
  };

  const generateCSSVariables = () => {
    // Helper to safely extract border color
    const getBorderColor = (borderString) => {
      if (!borderString) return 'initial';
      const parts = borderString.split(' ');
      return parts.length > 2 ? parts[2] : 'initial';
    };

    const css = `
/* Auto-generated CSS Variables from System Design */
:root {
  /* Colors */
  --color-primary: ${systemConfig.globalColors.primary};
  --color-secondary: ${systemConfig.globalColors.secondary};
  --color-accent: ${systemConfig.globalColors.accent};
  --color-success: ${systemConfig.globalColors.success};
  --color-warning: ${systemConfig.globalColors.warning};
  --color-error: ${systemConfig.globalColors.error};
  --color-background: ${systemConfig.globalColors.background};
  --color-surface: ${systemConfig.globalColors.surface};
  --color-text: ${systemConfig.globalColors.text};
  --color-text-secondary: ${systemConfig.globalColors.textSecondary};

  /* Typography */
  --font-family: ${systemConfig.typography.fontFamily};
  --font-size-base: ${systemConfig.typography.baseSize};
  --line-height: ${systemConfig.typography.lineHeight};
  --font-weight-light: ${systemConfig.typography.fontWeights.light};
  --font-weight-normal: ${systemConfig.typography.fontWeights.normal};
  --font-weight-medium: ${systemConfig.typography.fontWeights.medium};
  --font-weight-semibold: ${systemConfig.typography.fontWeights.semibold};
  --font-weight-bold: ${systemConfig.typography.fontWeights.bold};

  /* Spacing */
  --spacing-base: ${systemConfig.spacing.baseUnit};

  /* Components */
  --button-border-radius: ${systemConfig.components.buttons.borderRadius};
  --input-border-radius: ${systemConfig.components.inputs.borderRadius};
  --card-border-radius: ${systemConfig.components.cards.borderRadius};

  /* Buttons State */
  --button-active-bg: ${systemConfig.components.buttons.activeState.backgroundColor};
  --button-active-color: ${systemConfig.components.buttons.activeState.textColor};
  --button-active-border-color: ${getBorderColor(systemConfig.components.buttons.activeState.borderColor)};
  --button-inactive-bg: ${systemConfig.components.buttons.inactiveState.backgroundColor};
  --button-inactive-color: ${systemConfig.components.buttons.inactiveState.textColor};
  --button-inactive-border-color: ${getBorderColor(systemConfig.components.buttons.inactiveState.borderColor)};
  --button-inactive-opacity: ${systemConfig.components.buttons.inactiveState.opacity};

  /* Inputs */
  --input-bg: ${systemConfig.components.inputs.backgroundColor};
  --input-text-color: ${systemConfig.components.inputs.textColor};
  --input-placeholder-color: ${systemConfig.components.inputs.placeholderColor};
  --input-border-color: ${getBorderColor(systemConfig.components.inputs.border)};
  --input-focus-border-color: ${systemConfig.components.inputs.focusBorder};
  --input-focus-shadow: ${systemConfig.components.inputs.focusShadow};

  /* Dropdowns */
  --dropdown-bg: ${systemConfig.components.dropdowns.backgroundColor};
  --dropdown-border-color: ${systemConfig.components.dropdowns.borderColor};
  --dropdown-item-text-color: ${systemConfig.components.dropdowns.itemTextColor};
  --dropdown-item-hover-bg: ${systemConfig.components.dropdowns.itemHoverBackgroundColor};
  --dropdown-item-selected-bg: ${systemConfig.components.dropdowns.itemSelectedBackgroundColor};
  --dropdown-item-selected-color: ${systemConfig.components.dropdowns.itemSelectedTextColor};
  --dropdown-border-radius: ${systemConfig.components.dropdowns.borderRadius};

  /* Tooltips */
  --tooltip-bg: ${systemConfig.components.tooltips.backgroundColor};
  --tooltip-text-color: ${systemConfig.components.tooltips.textColor};
  --tooltip-border-radius: ${systemConfig.components.tooltips.borderRadius};
  --tooltip-padding: ${systemConfig.components.tooltips.padding};
  --tooltip-font-size: ${systemConfig.components.tooltips.fontSize};

  /* Cards */
  --card-shadow: ${systemConfig.components.cards.shadow};
  --card-border: ${systemConfig.components.cards.border};
}`;

    return css;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system design...</p>
        </div>
      </div>
    );
  }

  const ColorInput = ({ label, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs"
        />
      </div>
    </div>
  );

  // Reusable component for preview controls
  const PreviewSelectorControls = ({ showDraftModeToggle = false }) => (
    <div className="flex flex-wrap items-center gap-4 mt-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Role:</label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map(role => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Page:</label>
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Page" />
          </SelectTrigger>
          <SelectContent>
            {availablePages.map(page => (
              <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showDraftModeToggle && (
        <div className="flex items-center gap-2">
          <Button
            variant={draftMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDraftMode(!draftMode)}
          >
            {draftMode ? 'Draft Mode' : 'Live Mode'}
          </Button>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Design Management</h1>
                <p className="text-gray-600">Customize global design elements and component styling</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button onClick={handleSaveSystemConfig} disabled={saving || changeHistory.length === 0}>
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <TabSelector
            tabs={designTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Edit Mode Warning Banner */}
        {editModeActive && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">EDIT MODE ACTIVE</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              You are currently editing the live {editModeContext?.page} page for {editModeContext?.role} users.
              Changes will immediately affect the live website.
            </p>
          </div>
        )}

        {/* Global Design Tab */}
        {activeTab === 'global-design' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Palette
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(systemConfig.globalColors).map(([colorKey, colorValue]) => (
                    <div key={colorKey} className="flex items-center gap-4">
                      <label className="w-24 text-sm font-medium capitalize">
                        {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorValue}
                          onChange={(e) => updateSystemConfig(`globalColors.${colorKey}`, e.target.value)}
                          className="w-12 h-8 rounded border"
                        />
                        <Input
                          value={colorValue}
                          onChange={(e) => updateSystemConfig(`globalColors.${colorKey}`, e.target.value)}
                          className="w-24 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid className="w-5 h-5" />
                    Spacing & Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Base Spacing Unit</label>
                    <Input
                      value={systemConfig.spacing.baseUnit}
                      onChange={(e) => updateSystemConfig('spacing.baseUnit', e.target.value)}
                      placeholder="4px"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Breakpoints</label>
                    <div className="space-y-2">
                      {Object.entries(systemConfig.responsive.breakpoints).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-8 text-xs font-mono">{key}:</span>
                          <Input
                            value={value}
                            onChange={(e) => updateSystemConfig(`responsive.breakpoints.${key}`, e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW: Live Page Preview Section */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Page Preview
                  </CardTitle>
                  <PreviewSelectorControls showDraftModeToggle={true} />
                </CardHeader>
                <CardContent>
                  <PreviewFrame
                    page={selectedPage}
                    role={selectedRole}
                    systemConfig={systemConfig}
                    onElementClick={handleElementClick}
                    selectedGroup={selectedElementGroup}
                    elementGroups={elementGroups}
                    draftMode={draftMode}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div>
            {/* Buttons Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Button Styling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Border Radius</label>
                    <Input
                      value={systemConfig.components.buttons.borderRadius}
                      onChange={(e) => updateSystemConfig('components.buttons.borderRadius', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Padding X</label>
                    <Input
                      value={systemConfig.components.buttons.paddingX}
                      onChange={(e) => updateSystemConfig('components.buttons.paddingX', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Padding Y</label>
                    <Input
                      value={systemConfig.components.buttons.paddingY}
                      onChange={(e) => updateSystemConfig('components.buttons.paddingY', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Button Variants</h4>
                  <div className="space-y-4">
                    {Object.entries(systemConfig.components.buttons.variants).map(([variant, styles]) => (
                      <div key={variant} className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-3 capitalize">{variant} Button</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <ColorInput
                            label="Background"
                            value={styles.bg}
                            onChange={(v) => updateSystemConfig(`components.buttons.variants.${variant}.bg`, v)}
                          />
                          <ColorInput
                            label="Text Color"
                            value={styles.color}
                            onChange={(v) => updateSystemConfig(`components.buttons.variants.${variant}.color`, v)}
                          />
                          <div>
                            <label className="block text-xs font-medium mb-1">Border</label>
                            <Input
                              value={styles.border}
                              onChange={(e) => updateSystemConfig(`components.buttons.variants.${variant}.border`, e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NEW: Button States Styling */}
                <div>
                  <h4 className="font-medium mb-4">Button States</h4>
                  <div className="space-y-6">
                    {/* Active State */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-3">Active State (Normal)</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <ColorInput
                          label="Background"
                          value={systemConfig.components.buttons.activeState.backgroundColor}
                          onChange={(v) => updateSystemConfig('components.buttons.activeState.backgroundColor', v)}
                        />
                        <ColorInput
                          label="Text Color"
                          value={systemConfig.components.buttons.activeState.textColor}
                          onChange={(v) => updateSystemConfig('components.buttons.activeState.textColor', v)}
                        />
                        <ColorInput
                          label="Border Color"
                          value={systemConfig.components.buttons.activeState.borderColor}
                          onChange={(v) => updateSystemConfig('components.buttons.activeState.borderColor', v)}
                        />
                      </div>
                    </div>

                    {/* Inactive State */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-3">Inactive State (Disabled)</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <ColorInput
                          label="Background"
                          value={systemConfig.components.buttons.inactiveState.backgroundColor}
                          onChange={(v) => updateSystemConfig('components.buttons.inactiveState.backgroundColor', v)}
                        />
                        <ColorInput
                          label="Text Color"
                          value={systemConfig.components.buttons.inactiveState.textColor}
                          onChange={(v) => updateSystemConfig('components.buttons.inactiveState.textColor', v)}
                        />
                        <ColorInput
                          label="Border Color"
                          value={systemConfig.components.buttons.inactiveState.borderColor}
                          onChange={(v) => updateSystemConfig('components.buttons.inactiveState.borderColor', v)}
                        />
                        <div>
                          <label className="block text-sm font-medium mb-1">Opacity</label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={systemConfig.components.buttons.inactiveState.opacity}
                            onChange={(e) => updateSystemConfig('components.buttons.inactiveState.opacity', parseFloat(e.target.value))}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Input Styling Card - ENHANCED */}
              <Card>
                <CardHeader>
                  <CardTitle>Input Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Border Radius</label>
                      <Input value={systemConfig.components.inputs.borderRadius} onChange={(e) => updateSystemConfig('components.inputs.borderRadius', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Padding</label>
                      <Input value={systemConfig.components.inputs.padding} onChange={(e) => updateSystemConfig('components.inputs.padding', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Background Color" value={systemConfig.components.inputs.backgroundColor} onChange={(v) => updateSystemConfig('components.inputs.backgroundColor', v)} />
                    <ColorInput label="Text Color" value={systemConfig.components.inputs.textColor} onChange={(v) => updateSystemConfig('components.inputs.textColor', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Placeholder Color" value={systemConfig.components.inputs.placeholderColor} onChange={(v) => updateSystemConfig('components.inputs.placeholderColor', v)} />
                    <ColorInput label="Focus Border" value={systemConfig.components.inputs.focusBorder} onChange={(v) => updateSystemConfig('components.inputs.focusBorder', v)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Border</label>
                    <Input value={systemConfig.components.inputs.border} onChange={(e) => updateSystemConfig('components.inputs.border', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Dropdown Styling Card - NEW */}
              <Card>
                <CardHeader>
                  <CardTitle>Dropdown Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Background" value={systemConfig.components.dropdowns.backgroundColor} onChange={(v) => updateSystemConfig('components.dropdowns.backgroundColor', v)} />
                    <ColorInput label="Item Text" value={systemConfig.components.dropdowns.itemTextColor} onChange={(v) => updateSystemConfig('components.dropdowns.itemTextColor', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Item Hover BG" value={systemConfig.components.dropdowns.itemHoverBackgroundColor} onChange={(v) => updateSystemConfig('components.dropdowns.itemHoverBackgroundColor', v)} />
                    <ColorInput label="Item Selected BG" value={systemConfig.components.dropdowns.itemSelectedBackgroundColor} onChange={(v) => updateSystemConfig('components.dropdowns.itemSelectedBackgroundColor', v)} />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Item Selected Text" value={systemConfig.components.dropdowns.itemSelectedTextColor} onChange={(v) => updateSystemConfig('components.dropdowns.itemSelectedTextColor', v)} />
                    <div>
                      <label className="block text-sm font-medium mb-2">Border Radius</label>
                      <Input value={systemConfig.components.dropdowns.borderRadius} onChange={(e) => updateSystemConfig('components.dropdowns.borderRadius', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tooltip Styling Card - NEW */}
              <Card>
                <CardHeader>
                  <CardTitle>Tooltip Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput label="Background Color" value={systemConfig.components.tooltips.backgroundColor} onChange={(v) => updateSystemConfig('components.tooltips.backgroundColor', v)} />
                    <ColorInput label="Text Color" value={systemConfig.components.tooltips.textColor} onChange={(v) => updateSystemConfig('components.tooltips.textColor', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Border Radius</label>
                      <Input value={systemConfig.components.tooltips.borderRadius} onChange={(e) => updateSystemConfig('components.tooltips.borderRadius', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Padding</label>
                      <Input value={systemConfig.components.tooltips.padding} onChange={(e) => updateSystemConfig('components.components.tooltips.padding', e.target.value)} />
                    </div>
                  </div>
                   <div>
                      <label className="block text-sm font-medium mb-2">Font Size</label>
                      <Input value={systemConfig.components.tooltips.fontSize} onChange={(e) => updateSystemConfig('components.tooltips.fontSize', e.target.value)} />
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(systemConfig.components.cards).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <Input
                        value={value}
                        onChange={(e) => updateSystemConfig(`components.cards.${key}`, e.target.value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* NEW: Page Preview Section for Components */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Component Preview
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Template:</label>
                      <Select onValueChange={applyPresetTemplate}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Apply preset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light Theme</SelectItem>
                          <SelectItem value="dark">Dark Theme</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <PreviewSelectorControls />
                </CardHeader>
                <CardContent>
                  <PreviewFrame
                    page={selectedPage}
                    role={selectedRole}
                    systemConfig={systemConfig}
                    onElementClick={handleElementClick}
                    selectedGroup={selectedElementGroup}
                    elementGroups={elementGroups}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Typography System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <Input
                      value={systemConfig.typography.fontFamily}
                      onChange={(e) => updateSystemConfig('typography.fontFamily', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Base Font Size</label>
                    <Input
                      value={systemConfig.typography.baseSize}
                      onChange={(e) => updateSystemConfig('typography.baseSize', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Line Height</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={systemConfig.typography.lineHeight}
                      onChange={(e) => updateSystemConfig('typography.lineHeight', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Heading Scale</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={systemConfig.typography.headingScale}
                      onChange={(e) => updateSystemConfig('typography.headingScale', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Font Weights</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(systemConfig.typography.fontWeights).map(([weight, value]) => (
                      <div key={weight}>
                        <label className="block text-sm font-medium mb-2 capitalize">{weight}</label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => updateSystemConfig(`typography.fontWeights.${weight}`, parseInt(e.target.value))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Typography Preview Section */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography Preview
                  </CardTitle>
                  <PreviewSelectorControls />
                </CardHeader>
                <CardContent>
                  <PreviewFrame
                    page={selectedPage}
                    role={selectedRole}
                    systemConfig={systemConfig}
                    onElementClick={handleElementClick}
                    selectedGroup={selectedElementGroup}
                    elementGroups={elementGroups.filter(g => g.category === 'typography')}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* NEW: Global Components Tab */}
        {activeTab === 'global-components' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  Global Components Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Manage styling for components that appear across multiple pages and contexts.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Grid className="w-5 h-5" />
                        All Element Groups ({elementGroups.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {elementGroups.map(group => (
                          <div
                            key={group.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedElementGroup?.id === group.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedElementGroup(group)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">#{group.id}</Badge>
                                  <span className="font-medium text-sm">{group.name}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                              </div>
                              <Badge className="text-xs">{group.category}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Paintbrush className="w-5 h-5 mr-1" />
                        Global Component Editor
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUndo}
                          disabled={historyIndex < 0}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Undo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRedo}
                          disabled={historyIndex >= changeHistory.length - 1}
                        >
                          <RefreshCw className="w-4 h-4 mr-1 transform rotate-180" />
                          Redo
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedElementGroup ? (
                        <ElementGroupEditor
                          group={selectedElementGroup}
                          systemConfig={systemConfig}
                          onStyleChange={handleGroupStyleChange}
                          pageUsage={elementPageUsage[selectedElementGroup.id] || []}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Select a component group to edit its global styling</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overrides Tab */}
        {activeTab === 'overrides' && (
          <div className="space-y-8">
            {/* Add New Override */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Design Override
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Element</label>
                    <Input
                      placeholder="e.g., .btn-primary, #header, [data-role='teacher']"
                      value={newOverride.targetElement}
                      onChange={(e) => setNewOverride({ ...newOverride, targetElement: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Page</label>
                    <Select value={newOverride.targetPage} onValueChange={(value) => setNewOverride({ ...newOverride, targetPage: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="teacher-registration">Teacher Registration</SelectItem>
                        <SelectItem value="find-tutors">Find Tutors</SelectItem>
                        <SelectItem value="admin-dashboard">Admin Dashboard</SelectItem>
                        <SelectItem value="teacher-calendar">Teacher Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Role</label>
                    <Select value={newOverride.targetRole} onValueChange={(value) => setNewOverride({ ...newOverride, targetRole: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CSS Property</label>
                    <Input
                      placeholder="e.g., background-color, font-size, border-radius"
                      value={newOverride.property}
                      onChange={(e) => setNewOverride({ ...newOverride, property: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CSS Value</label>
                    <Input
                      placeholder="e.g., #ff0000, 16px, 4px"
                      value={newOverride.value}
                      onChange={(e) => setNewOverride({ ...newOverride, value: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Condition (Optional)</label>
                  <Input
                    placeholder="e.g., hover, focus, media query"
                    value={newOverride.condition}
                    onChange={(e) => setNewOverride({ ...newOverride, condition: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Describe what this override does and why it's needed"
                    value={newOverride.description}
                    onChange={(e) => setNewOverride({ ...newOverride, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddOverride} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Override
                </Button>
              </CardContent>
            </Card>

            {/* Existing Overrides */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Design Overrides</CardTitle>
              </CardHeader>
              <CardContent>
                {designOverrides.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No design overrides configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {designOverrides.map((override) => (
                      <div key={override.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{override.targetElement}</Badge>
                              {override.targetPage && override.targetPage !== 'all' && (
                                <Badge variant="secondary">{override.targetPage}</Badge>
                              )}
                              {override.targetRole && override.targetRole !== 'all' && (
                                <Badge>{override.targetRole}</Badge>
                              )}
                            </div>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded mb-2">
                              {override.property}: {override.value}
                              {override.condition && ` (${override.condition})`}
                            </div>
                            {override.description && (
                              <p className="text-sm text-gray-600">{override.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOverride(override.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NEW: Override Testing Preview */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Override Testing Preview
                  </CardTitle>
                  <PreviewSelectorControls />
                </CardHeader>
                <CardContent>
                  <PreviewFrame
                    page={selectedPage}
                    role={selectedRole}
                    systemConfig={systemConfig}
                    designOverrides={designOverrides}
                    onElementClick={handleElementClick}
                    selectedGroup={selectedElementGroup}
                    elementGroups={elementGroups}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-8">
            {/* Interactive Page Preview */}
            <InteractivePagePreview
              systemConfig={systemConfig}
              designOverrides={designOverrides}
              elementGroups={elementGroups}
              onElementClick={handleElementClick}
              selectedGroup={selectedElementGroup}
              onEditModeChange={handleEditModeChange}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              selectedPage={selectedPage}
              setSelectedPage={setSelectedPage}
            />

            {/* Generated CSS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Generated CSS Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  {generateCSSVariables()}
                </pre>
              </CardContent>
            </Card>

            {/* Component Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Component Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Buttons</h4>
                  <div className="flex flex-wrap gap-4">
                    <button
                      style={{
                        backgroundColor: systemConfig.components.buttons.variants.primary.bg,
                        color: systemConfig.components.buttons.variants.primary.color,
                        borderRadius: systemConfig.components.buttons.borderRadius,
                        padding: `${systemConfig.components.buttons.paddingY} ${systemConfig.components.buttons.paddingX}`,
                        fontSize: systemConfig.components.buttons.fontSize,
                        fontWeight: systemConfig.components.buttons.fontWeight,
                        border: systemConfig.components.buttons.variants.primary.border
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      style={{
                        backgroundColor: systemConfig.components.buttons.variants.secondary.bg,
                        color: systemConfig.components.buttons.variants.secondary.color,
                        borderRadius: systemConfig.components.buttons.borderRadius,
                        padding: `${systemConfig.components.buttons.paddingY} ${systemConfig.components.buttons.paddingX}`,
                        fontSize: systemConfig.components.buttons.fontSize,
                        fontWeight: systemConfig.components.buttons.fontWeight,
                        border: systemConfig.components.buttons.variants.secondary.border
                      }}
                    >
                      Secondary Button
                    </button>
                    <button
                      disabled
                      style={{
                        backgroundColor: systemConfig.components.buttons.inactiveState.backgroundColor,
                        color: systemConfig.components.buttons.inactiveState.textColor,
                        borderRadius: systemConfig.components.buttons.borderRadius,
                        padding: `${systemConfig.components.buttons.paddingY} ${systemConfig.components.buttons.paddingX}`,
                        fontSize: systemConfig.components.buttons.fontSize,
                        fontWeight: systemConfig.components.buttons.fontWeight,
                        border: systemConfig.components.buttons.inactiveState.borderColor,
                        opacity: systemConfig.components.buttons.inactiveState.opacity,
                        cursor: 'not-allowed', // Add a disabled cursor
                      }}
                    >
                      Disabled Button
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Typography</h4>
                  <div style={{ fontFamily: systemConfig.typography.fontFamily, lineHeight: systemConfig.typography.lineHeight }}>
                    <h1 style={{ fontSize: `calc(${systemConfig.typography.baseSize} * ${Math.pow(systemConfig.typography.headingScale, 4)})`, fontWeight: systemConfig.typography.fontWeights.bold, color: systemConfig.globalColors.text }}>
                      Heading 1
                    </h1>
                    <h2 style={{ fontSize: `calc(${systemConfig.typography.baseSize} * ${Math.pow(systemConfig.typography.headingScale, 3)})`, fontWeight: systemConfig.typography.fontWeights.semibold, color: systemConfig.globalColors.text }}>
                      Heading 2
                    </h2>
                    <p style={{ fontSize: systemConfig.typography.baseSize, fontWeight: systemConfig.typography.fontWeights.normal, color: systemConfig.globalColors.text }}>
                      This is body text with the configured typography settings.
                    </p>
                    <p style={{ fontSize: systemConfig.typography.baseSize, fontWeight: systemConfig.typography.fontWeights.normal, color: systemConfig.globalColors.textSecondary }}>
                      This is secondary text color.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Form Elements</h4>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label style={{color: systemConfig.globalColors.text, marginBottom: '4px', display: 'block'}}>Sample Input</label>
                      <input
                        type="text"
                        placeholder="Sample input field"
                        style={{
                          borderRadius: systemConfig.components.inputs.borderRadius,
                          padding: systemConfig.components.inputs.padding,
                          fontSize: systemConfig.components.inputs.fontSize,
                          border: systemConfig.components.inputs.border,
                          backgroundColor: systemConfig.components.inputs.backgroundColor,
                          color: systemConfig.components.inputs.textColor,
                          // Placeholder color cannot be directly applied via inline style for cross-browser consistency.
                          // It relies on the generated CSS variables being used in global styles or components.
                          width: '100%'
                        }}
                      />
                    </div>
                     <div>
                        <label style={{color: systemConfig.globalColors.text, marginBottom: '4px', display: 'block'}}>Sample Dropdown</label>
                        <Select>
                          <SelectTrigger style={{
                            borderRadius: systemConfig.components.dropdowns.borderRadius,
                            borderColor: systemConfig.components.dropdowns.borderColor,
                            backgroundColor: systemConfig.components.dropdowns.backgroundColor,
                            color: systemConfig.components.dropdowns.itemTextColor
                          }}>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent style={{
                              backgroundColor: systemConfig.components.dropdowns.backgroundColor,
                              borderColor: systemConfig.components.dropdowns.borderColor,
                              borderRadius: systemConfig.components.dropdowns.borderRadius,
                          }}>
                            {/* itemTextColor applies to items, hover/selected are handled by shadcn's internal CSS via variables */}
                            <SelectItem value="1" style={{color: systemConfig.components.dropdowns.itemTextColor}}>Option 1</SelectItem>
                            <SelectItem value="2" style={{color: systemConfig.components.dropdowns.itemTextColor}}>Option 2</SelectItem>
                            <SelectItem value="3" style={{color: systemConfig.components.dropdowns.itemTextColor}}>Option 3</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div>
                        <label style={{color: systemConfig.globalColors.text, marginBottom: '4px', display: 'block'}}>Sample Tooltip</label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline">Hover me</Button>
                                </TooltipTrigger>
                                <TooltipContent style={{
                                    backgroundColor: systemConfig.components.tooltips.backgroundColor,
                                    color: systemConfig.components.tooltips.textColor,
                                    borderRadius: systemConfig.components.tooltips.borderRadius,
                                    padding: systemConfig.components.tooltips.padding,
                                    fontSize: systemConfig.components.tooltips.fontSize,
                                }}>
                                    <p>This is a styled tooltip.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     </div>
                    <div
                      style={{
                        borderRadius: systemConfig.components.cards.borderRadius,
                        padding: systemConfig.components.cards.padding,
                        boxShadow: systemConfig.components.cards.shadow,
                        border: systemConfig.components.cards.border,
                        backgroundColor: systemConfig.globalColors.background
                      }}
                    >
                      <h5 style={{ margin: 0, marginBottom: '8px', fontWeight: systemConfig.typography.fontWeights.semibold }}>Sample Card</h5>
                      <p style={{ margin: 0, color: systemConfig.globalColors.textSecondary }}>This is how cards will look with your design system.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm System Design Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save changes to the system's appearance. Please review the summary below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm space-y-4 my-4">
            <div>
              <h4 className="font-semibold mb-2">Modified Element Groups:</h4>
              <div className="flex flex-wrap gap-2">
                {changeSummary.groups.map(groupName => (
                  <Badge key={groupName} variant="secondary">{groupName}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Affected Pages:</h4>
              <div className="flex flex-wrap gap-2">
                {changeSummary.pages.length > 0 ? changeSummary.pages.map(pageName => (
                  <Badge key={pageName}>{pageName}</Badge>
                )) : <p className="text-gray-500">No specific page mappings found for these changes.</p>}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSave}>
              Confirm and Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
