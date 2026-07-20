import { useWindowDimensions } from 'react-native';
import {
  Breakpoint,
  resolveBreakpoint,
  isPhoneWidth,
  isTabletWidth,
  isDesktopWidth,
  isLargeDesktopWidth,
} from './breakpoints';

// ─── Return type ─────────────────────────────────────────────────────────────

export interface BreakpointState {
  /** Current window width in logical pixels */
  width: number;
  /** Current window height in logical pixels */
  height: number;
  /** true when width < 600 */
  isPhone: boolean;
  /** true when 600 ≤ width < 1200 (small + large tablet combined) */
  isTablet: boolean;
  /** true when 1200 ≤ width < 1600 */
  isDesktop: boolean;
  /** true when width ≥ 1600 */
  isLargeDesktop: boolean;
  /** 'portrait' | 'landscape' */
  orientation: 'portrait' | 'landscape';
  /** Active named breakpoint */
  breakpoint: Breakpoint;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useBreakpoints
 *
 * Uses useWindowDimensions() — never Dimensions.get() — so it re-renders
 * automatically on rotation, window resize (Web), or split-screen.
 *
 * @example
 * const { isPhone, isTablet, breakpoint, width } = useBreakpoints();
 */
export function useBreakpoints(): BreakpointState {
  const { width, height } = useWindowDimensions();

  const breakpoint = resolveBreakpoint(width);
  const orientation: 'portrait' | 'landscape' = height >= width ? 'portrait' : 'landscape';

  return {
    width,
    height,
    isPhone:        isPhoneWidth(width),
    isTablet:       isTabletWidth(width),
    isDesktop:      isDesktopWidth(width),
    isLargeDesktop: isLargeDesktopWidth(width),
    orientation,
    breakpoint,
  };
}
