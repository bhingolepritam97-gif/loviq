import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from './Button';
import { Colors, Typography, Spacing, Radius } from '../theme';

export default function StickyFooter({
  photosCount,
  maxPhotos = 6,
  onContinue,
  insets,
}) {
  // Compute completion metrics
  // Assume photo upload contributes 42% to profile completion, or dynamic scaling
  const completionPercentage = Math.round((photosCount / maxPhotos) * 100);
  const profileCompletion = Math.round(25 + (photosCount / maxPhotos) * 35); // Base of 25% + up to 35% for photos

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)', 'rgba(255,255,255,1)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.footerContent}>
        <View style={styles.separator} />
        
        <View style={styles.footerProgressRow}>
          <Text style={styles.footerProgressText}>{photosCount} of {maxPhotos} Photos Added</Text>
          <Text style={styles.footerPercentageText}>Profile {profileCompletion}% Complete</Text>
        </View>

        <Button
          label="Continue →"
          onPress={onContinue}
          disabled={photosCount < 2}
          variant="gradient"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerContent: {
    backgroundColor: Colors.transparent,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
    width: '100%',
  },
  footerProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  footerProgressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '700',
  },
  footerPercentageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '800',
  },
});
