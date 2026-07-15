/**
 * Vela Brand Constants
 * Official brand identity tokens — never hardcode these values elsewhere.
 *
 * Identity — Midnight Sail:
 *   Ink    #12202E — wordmark, UI elements, dark backgrounds
 *   Accent #C6602E — sail accent, CTA, hearts, matches
 *   Cream  #F4EEE1 — backgrounds, light surfaces
 */

// ─── Core Brand Colors ─────────────────────────────────────
export const Brand = {
  // Primary palette — Midnight Sail
  navy: '#12202E',
  navyLight: '#1E3348',
  copper: '#C6602E',
  copperLight: '#D47842',
  cream: '#F4EEE1',
  creamDark: '#E5DFD3',
  
  // Semantic usage
  wordmark: '#12202E',       // The "vela" script
  sail: '#C6602E',            // The sail shape
  star: '#12202E',            // The four-pointed star
  
  // Gradient (accent → ink diagonal, for premium surfaces)
  gradientColors: ['#C6602E', '#12202E'],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 1 },
  
  // Inverted (for dark backgrounds)
  onDark: '#F4EEE1',
  onDarkMuted: 'rgba(244,238,225,0.7)',
};

// ─── Logo Sizes ────────────────────────────────────────────
export const LogoSize = {
  xs: { width: 48, height: 20 },
  sm: { width: 72, height: 30 },
  md: { width: 110, height: 46 },
  lg: { width: 160, height: 67 },
  xl: { width: 200, height: 84 },
  hero: { width: 260, height: 109 },
};

// Icon sizes (sail + star mark only)
export const IconSize = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 64,
  xl: 80,
  hero: 120,
};

// ─── Brand Spacing ─────────────────────────────────────────
export const BrandSpacing = {
  logoMarginTop: 32,
  logoMarginBottom: 24,
  logoInlineGap: 8,
};

// ─── Animation Durations ───────────────────────────────────
export const BrandAnimation = {
  fadeIn: 600,
  scaleIn: 700,
  pulse: 1800,
  float: 2800,
  splash: 2500,
  transitionDelay: 300,
  easing: 'bezier(0.25, 1, 0.5, 1)',
};

// ─── Brand Shadows ─────────────────────────────────────────
export const BrandShadow = {
  logo: {
    shadowColor: '#12202E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: '#C6602E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
};
