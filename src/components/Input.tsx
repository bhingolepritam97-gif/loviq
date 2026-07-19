import React from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Input — styled text input
 * @param {string} label
 * @param {string} placeholder
 * @param {string} value
 * @param {function} onChangeText
 * @param {string} keyboardType
 * @param {boolean} secureTextEntry
 * @param {string} error
 * @param {ReactNode} leftIcon
 * @param {ReactNode} rightIcon
 * @param {function} onRightIconPress
 * @param {object} style
 * @param {boolean} multiline
 * @param {number} numberOfLines
 * @param {string} autoCapitalize
 */
export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  ...props
}: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.focused,
        !!error && styles.errorBorder,
        !editable && styles.disabled,
        multiline && { height: 24 + numberOfLines * 22, alignItems: 'flex-start', paddingTop: Spacing.md },
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeft, rightIcon && styles.inputWithRight, multiline && styles.multiline]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          accessible={true}
          accessibilityLabel={label || placeholder || 'Text input'}
          {...props}
        />
        {rightIcon && (
          onRightIconPress ? (
            <TouchableOpacity 
              onPress={onRightIconPress} 
              style={styles.rightIcon}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Input right action"
            >
              {rightIcon}
            </TouchableOpacity>
          ) : (
            <View style={styles.rightIcon}>
              {rightIcon}
            </View>
          )
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  focused: {
    borderColor: Colors.borderFocus,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  disabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    height: '100%',
  },
  inputWithLeft: { marginLeft: Spacing.sm },
  inputWithRight: { marginRight: Spacing.sm },
  multiline: { textAlignVertical: 'top', paddingTop: 0 },
  leftIcon: { marginRight: 0 },
  rightIcon: { padding: Spacing.xs },
  error: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
