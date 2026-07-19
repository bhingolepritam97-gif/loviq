import React, { useRef } from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { createStyles } from '../styles/datingIntent.styles';
import { Gradients } from '../../../theme';

export default function ContinueButton({ isEnabled, onPress }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isEnabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    if (!isEnabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };

  return (
    <Animated.View style={{ width: '100%', transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isEnabled}
        style={[styles.btn, !isEnabled && styles.btnDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isEnabled }}
        accessibilityLabel={isEnabled ? 'Continue' : 'Select one option to continue'}
      >
        {isEnabled ? (
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>Continue →</Text>
          </LinearGradient>
        ) : (
          <Text style={[styles.btnText, styles.btnTextDisabled]}>
            Select one option to continue
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
export { ContinueButton };
