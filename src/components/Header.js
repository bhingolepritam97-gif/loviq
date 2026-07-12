import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProgressBar from './ProgressBar';
import { Colors, Typography, Spacing } from '../theme';

export default function Header({ onBack, currentStep = 4, totalSteps = 8 }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Step {currentStep} of {totalSteps}</Text>
      </View>
      <ProgressBar progress={currentStep} totalSteps={totalSteps} />
    </View>
  );
}

const styles = StyleSheet.create({
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
