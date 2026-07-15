/**
 * BrandLogo — Official Vela logo component.
 *
 * Renders the full wordmark ("vela" + sail + star).
 * Use this in welcome screens, onboarding, auth flows, and headers.
 *
 * Props:
 *   size     — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | { width, height }
 *   variant  — 'dark' (navy on light bg) | 'light' (cream on dark bg)
 *   style    — additional style for the container
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import VelaWordmark from './VelaWordmark';
import { LogoSize } from './brand';

const BrandLogo = ({ size = 'md', variant = 'dark', style, containerStyle }) => {
  const dims = typeof size === 'object' ? size : (LogoSize[size] || LogoSize.md);

  return (
    <View style={[styles.container, containerStyle]}>
      <VelaWordmark size={dims} variant={variant} style={style} />
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
