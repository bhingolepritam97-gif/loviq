import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SegmentedProgressBar from './SegmentedProgressBar';
import { Colors, Typography, Spacing } from '../theme';

export default function OnboardingHeader({
  onBack,
  currentStep,
  totalSteps = 12,
  title = 'Build Profile',
  subtitle = '',
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Segmented Progress Bar */}
      <SegmentedProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      {/* Nav Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>

        {/* Empty balancer to center the title */}
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.background,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitleText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
});
