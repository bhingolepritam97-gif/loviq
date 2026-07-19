/**
 * Lovly Brand Constants
 * Official brand identity tokens — never hardcode these values elsewhere.
 *
 * Identity — Romantic Midnight Rose:
 *   Pink      #E94B73 — logo, accent, CTA, hearts, matches
 *   Midnight  #1A0D26 — UI elements, dark backgrounds
 *   Rose-Cream #FFF8F9 — backgrounds, light surfaces
 */

// ─── Core Brand Colors ─────────────────────────────────────
export const Brand = {
  // Primary palette — Boutique Romantic
  navy: '#14051A',
  navyLight: '#1D0B26',
  copper: '#E8628F',
  copperLight: '#FBC9D6',
  cream: '#FFF9FA',
  creamDark: '#F3E8EC',
  
  // Semantic usage
  wordmark: '#E8628F',       // The "Lovly" script
  sail: '#E8628F',            // The L-heart ribbon shape
  star: '#FBC9D6',            // The star shape
  
  // Gradient (accent → ink diagonal, for premium surfaces)
  gradientColors: ['#E8628F', '#14051A'],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 1 },
  
  // Inverted (for dark backgrounds)
  onDark: '#FFF9FA',
  onDarkMuted: 'rgba(255,249,250,0.7)',
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
    shadowColor: '#1A0D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: '#E94B73',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
};
