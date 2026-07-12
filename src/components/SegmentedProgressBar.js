import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme';

export default function SegmentedProgressBar({ currentStep, totalSteps = 12 }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < currentStep && styles.progressActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    width: '100%',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
});
