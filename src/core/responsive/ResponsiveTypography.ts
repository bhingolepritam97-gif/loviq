/**
 * Lovly — Responsive Typography
 *
 * Breakpoint-aware type scale. Font sizes, line heights, and letter spacing
 * scale smoothly from phone → large desktop.
 *
 * Role map:
 *   display  → hero headlines (splash, welcome)
 *   title    → screen titles
 *   heading  → section headings
 *   subhead  → sub-headings
 *   body     → paragraph body text
 *   bodySmall→ secondary body / hint text
 *   caption  → labels, timestamps, badges
 *   button   → button labels
 *   buttonSm → small button labels
 *   overline → eyebrow / all-caps labels
 */

import { Platform, useWindowDimensions } from 'react-native';
import { resolveBreakpoint, Breakpoint } from './breakpoints';

// ─── Font families ────────────────────────────────────────────────────────────

export const FontFamily = {
  serif:    Platform.select({ ios: 'Georgia',  android: 'serif',       default: 'serif' }),
  sans:     Platform.select({ ios: 'System',   android: 'sans-serif',  default: 'sans-serif' }),
  sansMono: Platform.select({ ios: 'Courier',  android: 'monospace',   default: 'monospace' }),
} as const;

// ─── Type scale definition ────────────────────────────────────────────────────

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing: number;
  fontFamily: string;
}

export type TypographyRole =
  | 'display'
  | 'title'
  | 'heading'
  | 'subhead'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'buttonSm'
  | 'overline';

export type TypeScale = Record<TypographyRole, TypeStyle>;

// ─── Base scale (phone) ───────────────────────────────────────────────────────

const BASE: TypeScale = {
  display:   { fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -1.0, fontFamily: FontFamily.serif! },
  title:     { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5, fontFamily: FontFamily.serif! },
  heading:   { fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3, fontFamily: FontFamily.serif! },
  subhead:   { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2, fontFamily: FontFamily.sans!  },
  body:      { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing:  0.0, fontFamily: FontFamily.sans!  },
  bodySmall: { fontSize: 13, lineHeight: 19, fontWeight: '400', letterSpacing:  0.0, fontFamily: FontFamily.sans!  },
  caption:   { fontSize: 11, lineHeight: 16, fontWeight: '600', letterSpacing:  0.4, fontFamily: FontFamily.sans!  },
  button:    { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing:  0.6, fontFamily: FontFamily.sans!  },
  buttonSm:  { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing:  0.4, fontFamily: FontFamily.sans!  },
  overline:  { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing:  1.2, fontFamily: FontFamily.sans!  },
};

// ─── Scale multipliers (font size only) ───────────────────────────────────────

const FONT_SCALE: Record<Breakpoint, number> = {
  phone:        1.000,
  smallTablet:  1.100,
  largeTablet:  1.175,
  desktop:      1.250,
  largeDesktop: 1.325,
};

// ─── Builder ──────────────────────────────────────────────────────────────────

function buildTypeScale(breakpoint: Breakpoint): TypeScale {
  const scale = FONT_SCALE[breakpoint];
  const out: Partial<TypeScale> = {};

  for (const [role, base] of Object.entries(BASE) as [TypographyRole, TypeStyle][]) {
    const fs = Math.round(base.fontSize * scale);
    // Line height scales proportionally, rounded to nearest 0.5px equivalent
    const lh = Math.round(base.lineHeight * scale);
    out[role] = { ...base, fontSize: fs, lineHeight: lh };
  }

  return out as TypeScale;
}

// Pre-built maps (avoid per-render allocation)
export const TYPE_SCALE: Record<Breakpoint, TypeScale> = {
  phone:        buildTypeScale('phone'),
  smallTablet:  buildTypeScale('smallTablet'),
  largeTablet:  buildTypeScale('largeTablet'),
  desktop:      buildTypeScale('desktop'),
  largeDesktop: buildTypeScale('largeDesktop'),
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useResponsiveTypography
 *
 * Returns the full TypeScale map scaled to the current breakpoint.
 * Re-renders automatically on window resize / rotation.
 *
 * @example
 * const type = useResponsiveTypography();
 * <Text style={type.title}>Welcome</Text>
 *
 * @example — Merge with additional styles
 * <Text style={[type.body, { color: '#FFF0F3' }]}>Body text</Text>
 */
export function useResponsiveTypography(): TypeScale {
  const { width } = useWindowDimensions();
  const breakpoint = resolveBreakpoint(width);
  return TYPE_SCALE[breakpoint];
}

/**
 * useTypography (alias)
 * Shorter alias for useResponsiveTypography().
 */
export const useTypography = useResponsiveTypography;

// ─── Static helper ────────────────────────────────────────────────────────────

/**
 * getTypeStyle
 *
 * Returns a single TypeStyle for a given breakpoint without a hook.
 *
 * @example
 * const s = getTypeStyle('desktop', 'title');
 */
export function getTypeStyle(breakpoint: Breakpoint, role: TypographyRole): TypeStyle {
  return TYPE_SCALE[breakpoint][role];
}

/**
 * getResponsiveFontSize
 *
 * Returns just the font size number for a role + breakpoint.
 * Useful for inline calculations.
 */
export function getResponsiveFontSize(breakpoint: Breakpoint, role: TypographyRole): number {
  return TYPE_SCALE[breakpoint][role].fontSize;
}
