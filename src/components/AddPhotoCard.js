import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Typography } from '../theme';

export default function AddPhotoCard({ isRequired }) {
  return (
    <View style={styles.emptyCardInner}>
      <LinearGradient
        colors={['#FFF5F8', '#FFF9F6']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.contentWrap}>
        <Text style={styles.cameraIcon}>📸</Text>
        <Text style={styles.addText}>Add Photo</Text>
        <Text style={styles.formatText}>JPEG • PNG • HEIC</Text>
      </View>
      {isRequired && (
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E91E8C', // High contrast brand border
    borderRadius: Radius.xl,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  cameraIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  addText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary, // Clear high-contrast text
    marginBottom: 2,
  },
  formatText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  requiredBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    backgroundColor: '#FFE6F0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  requiredText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
