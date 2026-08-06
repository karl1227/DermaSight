// ─── SkinSense Theme ─────────────────────────────────────────────────────────
// Clinical teal and white design system

export const Colors = {
  // Primary palette
  primary: '#0A9B8E',        // main teal
  primaryDark: '#077A6E',    // darker teal for pressed states
  primaryLight: '#B2EBE8',   // soft teal background tint
  primaryUltraLight: '#E6F7F6', // very light teal bg

  // Secondary / accents
  accent: '#00C9B1',         // bright accent teal
  accentWarm: '#F0A500',     // amber accent for badges/warnings

  // Semantic colors
  danger: '#E53935',         // high concern / red
  dangerLight: '#FFEBEE',
  warning: '#F57C00',        // precancerous / orange
  warningLight: '#FFF3E0',
  success: '#2E7D32',        // benign / green
  successLight: '#E8F5E9',
  info: '#1565C0',           // informational blue
  infoLight: '#E3F2FD',

  // Neutrals
  white: '#FFFFFF',
  background: '#F4F8F8',     // app background
  surface: '#FFFFFF',        // card surface
  surfaceAlt: '#F0F5F5',     // alternate surface

  // Text
  textPrimary: '#1A2E2D',
  textSecondary: '#4A6665',
  textMuted: '#8AACAB',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#D0E8E7',
  borderLight: '#E8F2F2',

  // Overlay
  overlay: 'rgba(10, 155, 142, 0.08)',
  overlayDark: 'rgba(0,0,0,0.5)',

  // Status dot colors
  redDot: '#E53935',
  orangeDot: '#F57C00',
  greenDot: '#2E7D32',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,

  // Font weights (as literals for StyleSheet)
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 50,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0A9B8E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A9B8E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0A9B8E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
};
