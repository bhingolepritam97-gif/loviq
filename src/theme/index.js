// ─────────────────────────────────────────────
// Vela Design System
// Brand gradient: Magenta #E91E8C → Coral #FF6B35
// ─────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#E91E8C',
  secondary: '#FF6B35',
  gradientStart: '#E91E8C',
  gradientEnd: '#FF6B35',
  gradientColors: ['#E91E8C', '#FF6B35'],
  gradientAngle: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },

  // Surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#F0F0F5',
  borderFocus: '#E91E8C',

  // Text
  text: '#1A1A2E',
  textMuted: '#8A8A9A',
  textLight: '#BDBDCF',
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
  gold: '#F9A825',

  // Action buttons (swipe)
  likeGreen: '#00C48C',
  passRed: '#FF4757',
  superBlue: '#00B4D8',
  rewindGold: '#F9A825',
  boostPurple: '#9C27B0',

  // Chat
  bubbleSent: '#E91E8C',
  bubbleReceived: '#F5F5F5',
  bubbleSentText: '#FFFFFF',
  bubbleReceivedText: '#1A1A2E',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.25)',
  overlayHeavy: 'rgba(0,0,0,0.75)',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export const Typography = {
  // Font families (using system fonts — Inter via expo-google-fonts or system)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    extraBold: 'System',
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
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Gradient presets
export const Gradients = {
  primary: {
    colors: ['#E91E8C', '#FF6B35'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  primaryVertical: {
    colors: ['#E91E8C', '#FF6B35'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  dark: {
    colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  superLike: {
    colors: ['#00B4D8', '#0077B6'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  gold: {
    colors: ['#F9A825', '#FF8F00'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  premium: {
    colors: ['#9C27B0', '#E91E8C', '#FF6B35'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};
