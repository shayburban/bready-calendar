// Central color palette for the entire application
export const Colors = {
  // Brand Colors
  brand: {
    blue: '#0263c4',
    blueDark: '#0252a1',
    blueLight: '#3b82f6',
    blueHover: 'rgb(2, 98, 196)',
    green: '#28a745',
    greenDark: '#218838',
    greenLight: '#34d399',
  },

  // Action Colors
  actions: {
      green: '#22b41e', // Website green color
      websiteGreen: '#22b41e', // Explicit website green color
      websiteGreenHover: '#058e01', // Hover state for website green
  },

  // Button Colors
  buttons: {
    grey: {
      background: '#dfdfdf',
      text: '#767779',
      hover: '#22b41e', // Website green for hover
    },
  },

  // Dropdown Colors - New section for consistent dropdown styling
  dropdown: {
    background: '#f8f8f8',
    border: '#dfdcdc',
    text: '#878287',
    hover: '#f0f0f0',
    focus: '#007bff',
    focusBorder: '#007bff',
    focusShadow: 'rgba(0, 123, 255, 0.25)',
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  },

  // Status Colors
  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    successDark: '#065f46',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#92400e',
    error: '#ef4444',
    errorLight: '#fee2e2',
    errorDark: '#991b1b',
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#1e40af',
  },

  // Semantic Colors
  rating: {
    star: '#fbbf24',
    starFill: '#f59e0b',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    soft: '#f8f8f8',
    dark: '#1f2937',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
    focus: '#3b82f6',
  },

  // Text Colors
  text: {
    primary: '#5f5f5f',
    secondary: '#474747',
    default: '#3d3d3d',
    tertiary: '#6b7280',
    inverse: '#ffffff',
    muted: '#9ca3af',
    link: '#3b82f6',
    linkHover: '#2563eb',
  },

  // Typography
  typography: {
    sizes: {
      xs: '11px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },

  // Subject/Category Colors
  subjects: {
    chemistry: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#f59e0b',
    },
    programming: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#22c55e',
    },
    mathematics: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#3b82f6',
    },
    english: {
      bg: '#fce7f3',
      text: '#be185d',
      border: '#ec4899',
    },
    physics: {
      bg: '#f3e8ff',
      text: '#7c3aed',
      border: '#8b5cf6',
    },
    biology: {
      bg: '#ecfdf5',
      text: '#047857',
      border: '#10b981',
    },
  },

  // Priority Colors
  priority: {
    low: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#3b82f6',
    },
    medium: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#f59e0b',
    },
    high: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#ef4444',
    },
  },
};

// Helper functions for accessing colors
export const getSubjectColor = (subject) => {
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '');
  return Colors.subjects[normalizedSubject] || Colors.subjects.programming;
};

export const getPriorityColor = (priority) => {
  return Colors.priority[priority] || Colors.priority.medium;
};

// CSS custom properties for use in Tailwind
export const cssVariables = {
  '--color-brand-blue': Colors.brand.blue,
  '--color-brand-blue-dark': Colors.brand.blueDark,
  '--color-brand-green': Colors.brand.green,
  '--color-brand-green-dark': Colors.brand.greenDark,
  '--color-action-green': Colors.actions.green,
  '--color-website-green': Colors.actions.websiteGreen,
  '--color-website-green-hover': Colors.actions.websiteGreenHover,
  '--color-button-grey-bg': Colors.buttons.grey.background,
  '--color-button-grey-text': Colors.buttons.grey.text,
  '--color-button-grey-hover': Colors.buttons.grey.hover,
  '--color-dropdown-bg': Colors.dropdown.background,
  '--color-dropdown-border': Colors.dropdown.border,
  '--color-dropdown-text': Colors.dropdown.text,
  '--color-dropdown-hover': Colors.dropdown.hover,
  '--color-dropdown-focus': Colors.dropdown.focus,
  '--color-dropdown-focus-border': Colors.dropdown.focusBorder,
  '--color-dropdown-focus-shadow': Colors.dropdown.focusShadow,
  '--color-text-primary': Colors.text.primary,
  '--color-text-secondary': Colors.text.secondary,
  '--color-text-default': Colors.text.default,
  '--color-background-primary': Colors.background.primary,
  '--color-background-secondary': Colors.background.secondary,
  '--color-background-soft': Colors.background.soft,
  '--color-border-light': Colors.border.light,
  '--color-border-medium': Colors.border.medium,
};