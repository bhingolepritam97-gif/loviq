/**
 * BrandHeader — Official app header with the Vela logo.
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
import { Colors, Spacing, Radius, Shadow, Typography } from '../../theme';

const BrandHeader = ({
  showLogo = true,
  title,
  logoSize = 'sm',
  logoVariant = 'dark',
  rightIcon,
  onRightPress,
  backgroundColor = Colors.background,
  borderBottom = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor },
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
          >
            <Ionicons
              name={rightIcon || 'settings-outline'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
