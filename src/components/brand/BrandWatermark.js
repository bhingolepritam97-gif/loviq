/**
 * BrandWatermark — A subtle, low-opacity Vela mark.
 * Used in match screens, premium backgrounds, or empty states.
 *
 * Props:
 *   size     — default 'lg'
 *   opacity  — default 0.06
 *   variant  — 'dark' | 'light'
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import BrandLogo from './BrandLogo';

const BrandWatermark = ({ size = 'lg', opacity = 0.06, variant = 'dark', style }) => (
  <View style={[styles.container, { opacity }, style]} pointerEvents="none">
    <BrandLogo size={size} variant={variant} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(BrandWatermark);
