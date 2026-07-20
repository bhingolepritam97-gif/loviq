/**
 * src/core/responsive/index.ts
 *
 * Single entry point for the Lovly responsive infrastructure.
 *
 * Import everything from here:
 *   import { useBreakpoints, ResponsiveContainer, useTypography } from '../core/responsive';
 */

// ─── Breakpoints ──────────────────────────────────────────────────────────────
export {
  BREAKPOINT_VALUES,
  CONTAINER_MAX_WIDTHS,
  CONTAINER_H_PADDING,
  resolveBreakpoint,
  isPhoneWidth,
  isTabletWidth,
  isDesktopWidth,
  isLargeDesktopWidth,
} from './breakpoints';
export type { Breakpoint } from './breakpoints';

// ─── Hook: useBreakpoints ─────────────────────────────────────────────────────
export { useBreakpoints } from './useBreakpoints';
export type { BreakpointState } from './useBreakpoints';

// ─── Provider + context hook ──────────────────────────────────────────────────
export { ResponsiveProvider, useResponsive } from './ResponsiveProvider';
export type { ResponsiveContextValue } from './ResponsiveProvider';

// ─── Components ───────────────────────────────────────────────────────────────
export { ResponsiveContainer }   from './ResponsiveContainer';
export type { ResponsiveContainerProps }  from './ResponsiveContainer';

export { ResponsiveGrid, useGridColumns } from './ResponsiveGrid';
export type { ResponsiveGridProps }        from './ResponsiveGrid';

export { ResponsiveStack }       from './ResponsiveStack';
export type { ResponsiveStackProps }      from './ResponsiveStack';

export { ResponsiveScreen }      from './ResponsiveScreen';
export type { ResponsiveScreenProps }     from './ResponsiveScreen';

// ─── Spacing ──────────────────────────────────────────────────────────────────
export {
  BASE_SPACING,
  SPACING,
  useResponsiveSpacing,
  useSpacing,
  getSpacing,
} from './ResponsiveSpacing';
export type { SpacingKey, SpacingMap } from './ResponsiveSpacing';

// ─── Typography ───────────────────────────────────────────────────────────────
export {
  FontFamily,
  TYPE_SCALE,
  useResponsiveTypography,
  useTypography,
  getTypeStyle,
  getResponsiveFontSize,
} from './ResponsiveTypography';
export type {
  TypeStyle,
  TypographyRole,
  TypeScale,
} from './ResponsiveTypography';
