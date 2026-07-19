import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Chip — interest/tag chip, toggleable
 * @param {string} label
 * @param {string} emoji
 * @param {boolean} selected
 * @param {function} onPress
 * @param {string} size — 'sm' | 'md'
 */
export default function Chip({ label, emoji, selected = false, onPress, size = 'md', style }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        selected && styles.chipSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${label} chip${selected ? ', selected' : ''}`}
    >
      {emoji && <Text style={[styles.emoji, size === 'sm' && styles.emojiSm]}>{emoji}</Text>}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    margin: Spacing.xs,
  },
  chipSm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  emoji: {
    fontSize: Typography.fontSize.base,
    marginRight: Spacing.xs,
  },
  emojiSm: {
    fontSize: Typography.fontSize.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textMuted,
  },
  labelSm: {
    fontSize: Typography.fontSize.xs,
  },
  labelSelected: {
    color: Colors.primary,
  },
});
