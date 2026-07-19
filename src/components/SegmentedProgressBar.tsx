import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function SegmentedProgressBar({ currentStep, totalSteps = 12 }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
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

const createStyles = (Colors) => StyleSheet.create({
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
