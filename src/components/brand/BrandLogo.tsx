/**
 * BrandLogo — Official Lovly logo component.
 *
 * Renders the full wordmark ("Lovly" + sail + star).
 * Use this in welcome screens, onboarding, auth flows, and headers.
 *
 * Props:
 *   size     — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | { width, height }
 *   variant  — 'dark' (navy on light bg) | 'light' (cream on dark bg)
 *   style    — additional style for the container
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import LovlyWordmark from './LovlyWordmark';
import { LogoSize } from './brand';

interface BrandLogoProps {
  size?: any;
  variant?: 'dark' | 'light';
  style?: any;
  containerStyle?: any;
}

const BrandLogo = ({ size = 'md', variant = 'dark', style, containerStyle }: BrandLogoProps) => {
  const dims = typeof size === 'object' ? size : (LogoSize[size] || LogoSize.md);

  return (
    <View style={[styles.container, containerStyle]}>
      <LovlyWordmark size={dims} variant={variant} style={style} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});

export default memo(BrandLogo);
