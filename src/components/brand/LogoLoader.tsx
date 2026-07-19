/**
 * LogoLoader — Full-screen loading overlay with animated Lovly mark.
 *
 * Props:
 *   visible  — show/hide (default: true)
 *   inline   — compact version without full-screen overlay (default: false)
 *   variant  — 'dark' (for light screens) | 'light' (for dark overlays)
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedLogo from './AnimatedLogo';
import { Brand } from './brand';
import { useTheme } from '../../context/ThemeContext';

interface LogoLoaderProps {
  visible?: boolean;
  inline?: boolean;
  variant?: 'light' | 'dark';
}

const LogoLoader = ({ visible = true, inline = false, variant = 'dark' }: LogoLoaderProps) => {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  if (!visible) return null;

  if (inline) {
    return (
      <View style={styles.inlineContainer}>
        <AnimatedLogo type="icon" animation="pulse" size="md" variant={variant} />
      </View>
    );
  }

  return (
    <View style={[styles.overlay, { backgroundColor: variant === 'light' ? Brand.navy : Colors.background }]}>
      <AnimatedLogo type="icon" animation="pulse" size="lg" variant={variant === 'light' ? 'light' : 'dark'} />
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  inlineContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(LogoLoader);
