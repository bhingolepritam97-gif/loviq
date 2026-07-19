// ─────────────────────────────────────────────
// Lovly — GradientButton shared component
// ─────────────────────────────────────────────
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../theme';
import { useTheme } from '../context/ThemeContext';

/**
 * GradientButton — full-width gradient CTA
 * @param {string} label
 * @param {function} onPress
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {string} variant — 'gradient' | 'outline' | 'ghost' | 'danger'
 * @param {object} style — override container style
 * @param {object} labelStyle — override text style
 * @param {string} size — 'sm' | 'md' | 'lg'
 * @param {ReactNode} leftIcon
 * @param {ReactNode} rightIcon
 */
export default function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gradient',
  style,
  labelStyle,
  size = 'lg',
  leftIcon,
  rightIcon,
}: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const isDisabled = disabled || loading;
  const heights = { sm: 40, md: 48, lg: 56 };
  const fontSizes = { sm: Typography.fontSize.sm, md: Typography.fontSize.md, lg: Typography.fontSize.base };

  const containerStyle = [
    styles.base,
    { height: heights[size], borderRadius: Radius['2xl'] },
    style,
  ];

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={variant === 'gradient' ? Colors.white : Colors.primary} size="small" />
      ) : (
        <>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[
            styles.label,
            { fontSize: fontSizes[size] },
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost' && styles.labelGhost,
            variant === 'danger' && styles.labelDanger,
            isDisabled && variant === 'gradient' && styles.labelDisabled,
            labelStyle,
          ]}>
            {label}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </>
      )}
    </View>
  );

  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.85} 
        style={containerStyle}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
        />
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.75}
      style={[
        containerStyle,
        variant === 'gradient' && isDisabled && styles.disabled,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {content}
    </TouchableOpacity>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  base: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadow.primary,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  label: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  labelOutline: {
    color: Colors.primary,
  },
  labelGhost: {
    color: Colors.text,
  },
  labelDanger: {
    color: Colors.error,
  },
  labelDisabled: {
    color: Colors.white,
    opacity: 0.9,
  },
  disabled: {
    backgroundColor: Colors.primary + '66', // 40% opacity primary brand color
    shadowOpacity: 0,
    elevation: 0,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: Colors.errorLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
});
