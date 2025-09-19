export const Colors = {
  // Primary Colors - 70% Pink, 30% Purple
  primary: {
    pink: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899', // Main pink
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7', // Main purple
      600: '#9333EA',
      700: '#7C3AED',
      800: '#6B21A8',
      900: '#581C87',
    }
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0F172A',
  },

  // Text Colors
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
    muted: '#94A3B8',
  },

  // Border Colors
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },

  // Shadow Colors - Strong and visible
  shadow: {
    light: 'rgba(0, 0, 0, 0.15)',
    medium: 'rgba(0, 0, 0, 0.25)',
    dark: 'rgba(0, 0, 0, 0.4)',
  }
};

// Premium Gradients
export const Gradients = {
  primary: ['#EC4899', '#A855F7'], // Pink to Purple
  secondary: ['#F472B6', '#C084FC'], // Light Pink to Light Purple
  warm: ['#F9A8D4', '#D8B4FE'], // Very Light Pink to Very Light Purple
  cool: ['#BE185D', '#7C3AED'], // Dark Pink to Dark Purple
  subtle: ['#FCE7F3', '#F3E8FF'], // Very Light Pink to Very Light Purple
};

// Animation-friendly color transitions
export const ColorTransitions = {
  pinkToPurple: ['#EC4899', '#D8B4FE', '#A855F7'],
  purpleToPink: ['#A855F7', '#F472B6', '#EC4899'],
  warmToCool: ['#F9A8D4', '#C084FC', '#7C3AED'],
};
