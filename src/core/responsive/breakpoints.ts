/**
 * Lovly — Responsive Breakpoints
 *
 * Single source of truth for all breakpoint values.
 * Never use Dimensions.get() anywhere in the app — always use useWindowDimensions().
 */

// ─── Breakpoint pixel thresholds ────────────────────────────────────────────

export const BREAKPOINT_VALUES = {
  /** 0 – 599 */
  phone: 0,
  /** 600 – 899 */
  smallTablet: 600,
  /** 900 – 1199 */
  largeTablet: 900,
  /** 1200 – 1599 */
  desktop: 1200,
  /** 1600+ */
  largeDesktop: 1600,
} as const;

export type Breakpoint =
  | 'phone'
  | 'smallTablet'
  | 'largeTablet'
  | 'desktop'
  | 'largeDesktop';

// ─── Resolve current breakpoint from width ───────────────────────────────────

export function resolveBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINT_VALUES.largeDesktop) return 'largeDesktop';
  if (width >= BREAKPOINT_VALUES.desktop)      return 'desktop';
  if (width >= BREAKPOINT_VALUES.largeTablet)  return 'largeTablet';
  if (width >= BREAKPOINT_VALUES.smallTablet)  return 'smallTablet';
  return 'phone';
}

// ─── Boolean helpers ─────────────────────────────────────────────────────────

export function isPhoneWidth(width: number): boolean {
  return width < BREAKPOINT_VALUES.smallTablet;
}

export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINT_VALUES.smallTablet && width < BREAKPOINT_VALUES.desktop;
}

export function isDesktopWidth(width: number): boolean {
  return width >= BREAKPOINT_VALUES.desktop && width < BREAKPOINT_VALUES.largeDesktop;
}

export function isLargeDesktopWidth(width: number): boolean {
  return width >= BREAKPOINT_VALUES.largeDesktop;
}

// ─── Container max-widths per breakpoint ────────────────────────────────────

export const CONTAINER_MAX_WIDTHS: Record<Breakpoint, number> = {
  phone:        540,   // full-bleed on phone
  smallTablet:  720,
  largeTablet:  960,
  desktop:      1140,
  largeDesktop: 1400,
};

// ─── Horizontal padding per breakpoint ──────────────────────────────────────

export const CONTAINER_H_PADDING: Record<Breakpoint, number> = {
  phone:        16,
  smallTablet:  24,
  largeTablet:  32,
  desktop:      40,
  largeDesktop: 48,
};
