/**
 * Lovly — Responsive Spacing
 *
 * Breakpoint-aware spacing tokens that scale from phone → large desktop.
 * Use these instead of hardcoded numbers so every screen adapts automatically.
 *
 * Base scale (phone):
 *   xs: 4   sm: 8   md: 12   lg: 16   xl: 24   2xl: 32
 *
 * Scale multipliers per breakpoint:
 *   phone:        1.0×
 *   smallTablet:  1.125×
 *   largeTablet:  1.25×
 *   desktop:      1.375×
 *   largeDesktop: 1.5×
 */

import { useWindowDimensions } from 'react-native';
import { resolveBreakpoint, Breakpoint } from './breakpoints';

// ─── Base token values (phone / 1× scale) ────────────────────────────────────

/** Static (non-reactive) base spacing tokens — phone scale. */
export const BASE_SPACING = {
  xs:    4,
  sm:    8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

export type SpacingKey = keyof typeof BASE_SPACING;

// ─── Scale multipliers ────────────────────────────────────────────────────────

const SCALE: Record<Breakpoint, number> = {
  phone:        1.000,
  smallTablet:  1.125,
  largeTablet:  1.250,
  desktop:      1.375,
  largeDesktop: 1.500,
};

// ─── Computed spacing map per breakpoint ─────────────────────────────────────

export type SpacingMap = {
  [K in SpacingKey]: number;
};

function buildSpacingMap(breakpoint: Breakpoint): SpacingMap {
  const m = SCALE[breakpoint];
  const out: Partial<SpacingMap> = {};
  for (const [key, value] of Object.entries(BASE_SPACING) as [SpacingKey, number][]) {
    out[key] = Math.round(value * m);
  }
  return out as SpacingMap;
}

// Pre-built maps for all breakpoints (avoids per-render object allocation)
export const SPACING: Record<Breakpoint, SpacingMap> = {
  phone:        buildSpacingMap('phone'),
  smallTablet:  buildSpacingMap('smallTablet'),
  largeTablet:  buildSpacingMap('largeTablet'),
  desktop:      buildSpacingMap('desktop'),
  largeDesktop: buildSpacingMap('largeDesktop'),
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useResponsiveSpacing
 *
 * Returns a spacing map scaled to the current breakpoint.
 * Re-renders automatically on window resize / rotation.
 *
 * @example
 * const sp = useResponsiveSpacing();
 * <View style={{ padding: sp.xl, gap: sp.md }} />
 */
export function useResponsiveSpacing(): SpacingMap {
  const { width } = useWindowDimensions();
  const breakpoint = resolveBreakpoint(width);
  return SPACING[breakpoint];
}

/**
 * useSpacing (alias)
 * Shorter alias for useResponsiveSpacing().
 */
export const useSpacing = useResponsiveSpacing;

// ─── Static helper ────────────────────────────────────────────────────────────

/**
 * getSpacing
 *
 * Returns a single spacing value for a given breakpoint without a hook.
 * Useful inside StyleSheet.create() where hooks can't be called.
 *
 * @example
 * const pad = getSpacing('desktop', 'xl'); // → 33
 */
export function getSpacing(breakpoint: Breakpoint, key: SpacingKey): number {
  return SPACING[breakpoint][key];
}
