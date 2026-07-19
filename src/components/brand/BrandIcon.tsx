/**
 * BrandIcon — The compact Lovly sail+star mark for small contexts.
 *
 * Use in: tab bars, loading overlays, notification icons, watermarks.
 * Never use raw assets/icon.png — always use this component.
 *
 * Props:
 *   size     — 'xs'|'sm'|'md'|'lg'|'xl'|'hero' | number
 *   variant  — 'dark' | 'light'
 *   style, containerStyle
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import LovlySailMark from './LovlySailMark';
import { IconSize } from './brand';

interface BrandIconProps {
  size?: any;
  variant?: 'dark' | 'light';
  style?: any;
  containerStyle?: any;
}

const BrandIcon = ({ size = 'md', variant = 'dark', style, containerStyle }: BrandIconProps) => {
  const iconSize = typeof size === 'number' ? size : (IconSize[size] || IconSize.md);

  return (
    <View style={[styles.container, { width: iconSize, height: iconSize }, containerStyle]}>
      <LovlySailMark size={iconSize} variant={variant} style={style} />
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

export default memo(BrandIcon);
