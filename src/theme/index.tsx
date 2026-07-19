// ─────────────────────────────────────────────
// Lovly Design System — Romantic Midnight Rose
// Brand palette inspired by L-Heart: Pink #E94B73 · Midnight #120A1C
// ─────────────────────────────────────────────

export const LightColors = {
  // Brand
  primary: '#E8628F',
  secondary: '#F1D5A5',
  gradientStart: '#E8628F',
  gradientEnd: '#C53D6B',
  gradientColors: ['#E8628F', '#C53D6B'],
  gradientAngle: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },

  // Surfaces
  background: '#FFF9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#F3E8EC',
  borderFocus: '#E8628F',

  // Text
  text: '#14051A',
  textMuted: '#7A667A',
  textLight: '#A592A5',
  textWhite: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  // States
  success: '#00C48C',
  successLight: '#E6FBF4',
  error: '#FF4757',
  errorLight: '#FFEBEE',
  warning: '#FFB800',
  warningLight: '#FFF8E6',
  superLike: '#00B4D8',
  superLikeLight: '#E0F7FA',
  gold: '#F1D5A5',

  // Action buttons (swipe)
  likeGreen: '#00C48C',
  passRed: '#FF4757',
  superBlue: '#00B4D8',
  rewindGold: '#F1D5A5',
  boostPurple: '#C53D6B',

  // Chat
  bubbleSent: '#E8628F',
  bubbleReceived: '#F3E8EC',
  bubbleSentText: '#FFFFFF',
  bubbleReceivedText: '#14051A',

  // Overlay
  overlay: 'rgba(20,5,26,0.5)',
  overlayLight: 'rgba(20,5,26,0.25)',
  overlayHeavy: 'rgba(20,5,26,0.75)',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkColors = {
  ...LightColors,
  background: '#14051A', // Midnight Violet/Black
  surface: '#1D0B26',
  surfaceElevated: '#2A1038',
  border: '#3A1E4A',
  text: '#FFF0F3',
  textMuted: '#C4B4C0',
  textLight: '#A592A5',
  bubbleReceived: '#3A1E4A',
  bubbleReceivedText: '#FFF0F3',
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.4)',
  overlayHeavy: 'rgba(0,0,0,0.8)',
};

// Fallback for files not yet refactored to useTheme
export const Colors = LightColors;

import { Platform } from 'react-native';

export const Typography = {
  // Font families (using native serif & sans-serif fallbacks for Georgia & Plus Jakarta Sans)
  fontFamily: {
    serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    sansSerif: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    
    // Legacy maps
    regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    medium: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    semiBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    extraBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  },

  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A0D26',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A0D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A0D26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#E94B73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Gradient presets
export const Gradients = {
  primary: {
    colors: ['#E8628F', '#C53D6B'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  primaryVertical: {
    colors: ['#E8628F', '#C53D6B'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  dark: {
    colors: ['rgba(20,5,26,0)', 'rgba(20,5,26,0.9)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  superLike: {
    colors: ['#00B4D8', '#0077B6'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  gold: {
    colors: ['#F1D5A5', '#CBA358'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  premium: {
    colors: ['#14051A', '#E8628F', '#F1D5A5'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const theme = { colors: Colors, typography: Typography, spacing: Spacing, radius: Radius };
