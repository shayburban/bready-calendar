// Central typography system for the entire application
export const Typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'Oxygen Mono', 'Ubuntu Monospace', 'Source Code Pro', 'Fira Mono', 'Droid Sans Mono', 'Courier New', 'monospace'],
  },

  // Font Sizes
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem',     // 128px
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Predefined Text Styles
  styles: {
    // Headings
    h1: {
      fontSize: Typography.fontSize['4xl'],
      fontWeight: Typography.fontWeight.bold,
      lineHeight: Typography.lineHeight.tight,
      letterSpacing: Typography.letterSpacing.tight,
    },
    h2: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      lineHeight: Typography.lineHeight.tight,
      letterSpacing: Typography.letterSpacing.tight,
    },
    h3: {
      fontSize: Typography.fontSize['2xl'],
      fontWeight: Typography.fontWeight.semibold,
      lineHeight: Typography.lineHeight.snug,
    },
    h4: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.semibold,
      lineHeight: Typography.lineHeight.snug,
    },
    h5: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: Typography.lineHeight.normal,
    },
    h6: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: Typography.lineHeight.normal,
    },

    // Body Text
    bodyLarge: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.relaxed,
    },
    body: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.normal,
    },
    bodySmall: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.normal,
    },

    // UI Text
    button: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: Typography.lineHeight.none,
      letterSpacing: Typography.letterSpacing.wide,
    },
    buttonLarge: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: Typography.lineHeight.none,
      letterSpacing: Typography.letterSpacing.wide,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: Typography.lineHeight.normal,
    },
    caption: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.normal,
      color: '#6b7280',
    },
    overline: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
      lineHeight: Typography.lineHeight.normal,
      letterSpacing: Typography.letterSpacing.widest,
      textTransform: 'uppercase',
    },

    // Special Text
    hero: {
      fontSize: Typography.fontSize['6xl'],
      fontWeight: Typography.fontWeight.bold,
      lineHeight: Typography.lineHeight.none,
      letterSpacing: Typography.letterSpacing.tight,
    },
    subtitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.light,
      lineHeight: Typography.lineHeight.relaxed,
    },
    lead: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.relaxed,
    },

    // Code and Mono
    code: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.mono,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.normal,
    },
    codeBlock: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.mono,
      fontWeight: Typography.fontWeight.normal,
      lineHeight: Typography.lineHeight.relaxed,
    },
  },

  // Responsive Typography
  responsive: {
    // Mobile-first approach
    mobile: {
      h1: Typography.fontSize['2xl'],
      h2: Typography.fontSize.xl,
      h3: Typography.fontSize.lg,
      hero: Typography.fontSize['3xl'],
      subtitle: Typography.fontSize.lg,
    },
    tablet: {
      h1: Typography.fontSize['3xl'],
      h2: Typography.fontSize['2xl'],
      h3: Typography.fontSize.xl,
      hero: Typography.fontSize['4xl'],
      subtitle: Typography.fontSize.xl,
    },
    desktop: {
      h1: Typography.fontSize['4xl'],
      h2: Typography.fontSize['3xl'],
      h3: Typography.fontSize['2xl'],
      hero: Typography.fontSize['6xl'],
      subtitle: Typography.fontSize.xl,
    },
  },
};

// Helper function to get responsive font size
export const getResponsiveTextSize = (element, breakpoint = 'desktop') => {
  return Typography.responsive[breakpoint]?.[element] || Typography.styles[element]?.fontSize || Typography.fontSize.base;
};

// CSS classes for common text styles
export const textClasses = {
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-bold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-semibold leading-snug',
  h5: 'text-lg font-medium leading-normal',
  h6: 'text-base font-medium leading-normal',
  body: 'text-base font-normal leading-normal',
  bodySmall: 'text-sm font-normal leading-normal',
  caption: 'text-xs font-normal leading-normal text-gray-500',
  button: 'text-sm font-medium leading-none tracking-wide',
  label: 'text-sm font-medium leading-normal',
  overline: 'text-xs font-semibold leading-normal tracking-widest uppercase',
  hero: 'text-6xl font-bold leading-none tracking-tight',
  subtitle: 'text-xl font-light leading-relaxed',
  lead: 'text-lg font-normal leading-relaxed',
};