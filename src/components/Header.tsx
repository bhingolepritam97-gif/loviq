import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProgressBar from './ProgressBar';
import { Typography, Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ onBack, currentStep = 4, totalSteps = 8 }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <View style={styles.backButtonContent}>
            <Ionicons name="arrow-back" size={20} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Step {currentStep} of {totalSteps}</Text>
      </View>
      <ProgressBar progress={currentStep} totalSteps={totalSteps} />
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  backButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  stepTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});
