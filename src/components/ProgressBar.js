import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Gradients } from '../theme';

export default function ProgressBar({ progress, totalSteps = 8 }) {
  const percent = Math.min(100, Math.max(0, (progress / totalSteps) * 100));

  return (
    <View style={styles.progressContainer}>
      <LinearGradient
        colors={Gradients.primary.colors}
        start={Gradients.primary.start}
        end={Gradients.primary.end}
        style={[styles.progressBarFill, { width: `${percent}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
