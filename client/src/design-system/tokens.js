const tokens = {
  colors: {
    primary: { 
      50: '#f0fdfa', 
      100: '#ccfbf1', 
      200: '#99f6e4', 
      300: '#5eead4', 
      400: '#2dd4bf', 
      500: '#14b8a6', // Main Teal
      600: '#0d9488', 
      700: '#0f766e', 
      800: '#115e59', 
      900: '#134e4a' 
    },
    neutral: { 
      50: '#f8fafc', 
      100: '#f1f5f9', 
      200: '#e2e8f0', 
      300: '#cbd5e1', 
      400: '#94a3b8', 
      500: '#64748b', 
      600: '#475569', 
      700: '#334155', // Body Text
      800: '#1e293b', // Headings
      900: '#0f172a' 
    },
    success: { light: '#dcfce7', DEFAULT: '#22c55e', dark: '#15803d' },
    warning: { light: '#fef3c7', DEFAULT: '#f59e0b', dark: '#b45309' },
    danger:  { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#b91c1c' },
    info:    { light: '#e0f2fe', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
  },
  typography: {
    fontFamily: { 
      display: "'DM Sans', sans-serif", 
      body: "'Inter', sans-serif" 
    },
    fontSize: { 
      xs: '0.75rem', 
      sm: '0.875rem', 
      base: '1rem', 
      lg: '1.125rem', 
      xl: '1.25rem', 
      '2xl': '1.5rem', 
      '3xl': '1.875rem', 
      '4xl': '2.25rem' 
    },
    fontWeight: { 
      regular: 400, 
      medium: 500, 
      semibold: 600, 
      bold: 700 
    },
    lineHeight: { 
      tight: 1.25, 
      snug: 1.375, 
      normal: 1.5, 
      relaxed: 1.625 
    },
  },
  spacing: { 
    0: '0px',
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px
    3: '0.75rem', // 12px
    4: '1rem',    // 16px
    5: '1.25rem', // 20px
    6: '1.5rem',  // 24px
    8: '2rem',    // 32px
    10: '2.5rem', // 40px
    12: '3rem',   // 48px
    16: '4rem',   // 64px
    20: '5rem',   // 80px
  },
  borderRadius: { 
    sm: '0.125rem', 
    DEFAULT: '0.25rem', 
    md: '0.375rem', 
    lg: '0.5rem', 
    xl: '0.75rem', 
    '2xl': '1rem', 
    full: '9999px' 
  },
  shadows: { 
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', 
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', 
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
  },
  transitions: { 
    fast: '150ms', 
    normal: '250ms', 
    slow: '350ms' 
  },
  zIndex: { 
    base: 0, 
    dropdown: 1000, 
    sticky: 1100, 
    overlay: 1200, 
    modal: 1300, 
    toast: 1400 
  },
};

module.exports = tokens;
