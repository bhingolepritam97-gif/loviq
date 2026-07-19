/**
 * BrandWatermark — A subtle, low-opacity Lovly mark.
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

interface BrandWatermarkProps {
  size?: any;
  opacity?: number;
  variant?: 'light' | 'dark';
  style?: any;
}

const BrandWatermark = ({ size = 'lg', opacity = 0.06, variant = 'dark', style }: BrandWatermarkProps) => (
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
