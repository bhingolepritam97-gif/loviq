/**
 * VelaSailMark — The sail + star icon-only mark (no wordmark text).
 * Used in small contexts: tab bar, notification icon, avatar watermarks.
 *
 * Pure React Native — no external dependency.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Brand, IconSize } from './brand';

const VelaSailMark = ({ size = 'md', variant = 'dark', style, containerStyle }) => {
  const iconSize = typeof size === 'number' ? size : (IconSize[size] || IconSize.md);
  const scale = iconSize / 40; // Normalized to md=40

  const markColor = variant === 'light' ? Brand.onDark : Brand.navy;
  const sailColor = Brand.copper;

  return (
    <View style={[styles.container, { width: iconSize, height: iconSize }, containerStyle]}>
      <View style={[styles.inner, style]}>
        {/* Vertical mast of the sail */}
        <View
          style={{
            position: 'absolute',
            width: scale * 3,
            height: iconSize * 0.65,
            backgroundColor: markColor,
            borderRadius: scale * 2,
            bottom: iconSize * 0.05,
            left: '50%',
            transform: [{ translateX: -scale * 1.5 }],
          }}
        />
        {/* Sail shape (right-leaning triangle) */}
        <View
          style={{
            position: 'absolute',
            bottom: iconSize * 0.22,
            left: '50%',
            width: 0,
            height: 0,
            borderLeftWidth: 0,
            borderRightWidth: scale * 14,
            borderBottomWidth: iconSize * 0.45,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: sailColor,
          }}
        />
        {/* Four-pointed star (bottom right) */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: scale * 2,
            width: scale * 10,
            height: scale * 10,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: scale * 2,
              height: scale * 10,
              backgroundColor: markColor,
              borderRadius: scale,
              top: 0,
              left: scale * 4,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: scale * 10,
              height: scale * 2,
              backgroundColor: markColor,
              borderRadius: scale,
              top: scale * 4,
              left: 0,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  inner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
});

export default memo(VelaSailMark);
