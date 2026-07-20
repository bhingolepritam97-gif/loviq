import React, { createContext, useContext, ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  smallTablet: 600,
  largeTablet: 900,
  desktop: 1200,
  largeDesktop: 1600,
};

interface ResponsiveContextType {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoint: 'phone' | 'smallTablet' | 'largeTablet' | 'desktop' | 'largeDesktop';
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();

  let breakpoint: ResponsiveContextType['breakpoint'] = 'phone';
  if (width >= BREAKPOINTS.largeDesktop) breakpoint = 'largeDesktop';
  else if (width >= BREAKPOINTS.desktop) breakpoint = 'desktop';
  else if (width >= BREAKPOINTS.largeTablet) breakpoint = 'largeTablet';
  else if (width >= BREAKPOINTS.smallTablet) breakpoint = 'smallTablet';

  const isPhone = width < BREAKPOINTS.smallTablet;
  const isTablet = width >= BREAKPOINTS.smallTablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLargeDesktop = width >= BREAKPOINTS.largeDesktop;

  return (
    <ResponsiveContext.Provider
      value={{
        width,
        height,
        isPhone,
        isTablet,
        isDesktop,
        isLargeDesktop,
        breakpoint,
      }}
    >
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useBreakpoints = (): ResponsiveContextType => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useBreakpoints must be used within a ResponsiveProvider');
  }
  return context;
};
