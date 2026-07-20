import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { BreakpointState, useBreakpoints } from './useBreakpoints';
import { CONTAINER_MAX_WIDTHS, CONTAINER_H_PADDING } from './breakpoints';

// ─── Extended context value ──────────────────────────────────────────────────

export interface ResponsiveContextValue extends BreakpointState {
  /** Recommended max-width for the current breakpoint */
  containerMaxWidth: number;
  /** Recommended horizontal padding for the current breakpoint */
  containerHPadding: number;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ResponsiveContext = createContext<ResponsiveContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface ResponsiveProviderProps {
  children: ReactNode;
}

/**
 * ResponsiveProvider (core)
 *
 * Wraps the app once at the root level. Computes breakpoint state from
 * useWindowDimensions() and distributes it via context to avoid
 * repeated hook calls in every leaf component.
 *
 * NOTE: The existing src/context/ResponsiveContext.tsx is still used by
 * legacy screens. This provider is the definitive implementation for all
 * new screens and shared components.
 */
export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const state = useBreakpoints();

  const value = useMemo<ResponsiveContextValue>(
    () => ({
      ...state,
      containerMaxWidth: CONTAINER_MAX_WIDTHS[state.breakpoint],
      containerHPadding: CONTAINER_H_PADDING[state.breakpoint],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.width, state.height, state.breakpoint],
  );

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// ─── Consumer hook ───────────────────────────────────────────────────────────

/**
 * useResponsive
 *
 * Returns the full responsive context including container dimensions.
 * Must be a descendant of <ResponsiveProvider>.
 */
export function useResponsive(): ResponsiveContextValue {
  const ctx = useContext(ResponsiveContext);
  if (ctx === undefined) {
    throw new Error('[Lovly] useResponsive() must be used inside <ResponsiveProvider>.');
  }
  return ctx;
}
