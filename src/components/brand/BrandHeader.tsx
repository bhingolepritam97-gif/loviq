/**
 * BrandHeader — Official app header with the Lovly logo.
 *
 * Renders a clean top bar with the logo centered or left-aligned,
 * and an optional right action button.
 *
 * Props:
 *   showLogo       — show wordmark (default: true)
 *   title          — plain text title (shown when showLogo is false)
 *   logoSize       — logo size preset (default: 'sm')
 *   logoVariant    — 'dark' | 'light'
 *   rightIcon      — Ionicons name string for right button
 *   onRightPress   — callback for right button
 *   backgroundColor — override background color
 *   borderBottom   — show bottom border (default: false)
 *   style          — additional container style
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from './BrandLogo';
import { Brand } from './brand';
import { Spacing, Radius, Shadow, Typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface BrandHeaderProps {
  showLogo?: boolean;
  title?: string;
  logoSize?: any;
  logoVariant?: 'dark' | 'light';
  rightIcon?: string;
  onRightPress?: () => void;
  backgroundColor?: string;
  borderBottom?: boolean;
  style?: any;
}

const BrandHeader = ({
  showLogo = true,
  title,
  logoSize = 'sm',
  logoVariant = 'dark',
  rightIcon,
  onRightPress,
  backgroundColor,
  borderBottom = false,
  style,
}: BrandHeaderProps) => {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: backgroundColor || Colors.background },
        borderBottom && styles.bordered,
        style,
      ]}
    >
      {/* Left spacer to keep logo centered */}
      <View style={styles.side} />

      {/* Center: Logo or title */}
      <View style={styles.center}>
        {showLogo ? (
          <BrandLogo size={logoSize} variant={logoVariant} />
        ) : title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
      </View>

      {/* Right action */}
      <View style={styles.side}>
        {onRightPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={rightIcon ? `Action for ${rightIcon}` : 'Settings'}
          >
            <Ionicons
              name={(rightIcon || 'settings-outline') as any}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    width: '100%',
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  side: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
});

export default memo(BrandHeader);
