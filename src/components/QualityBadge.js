import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '../theme';

export default function QualityBadge({ passed }) {
  return (
    <View style={[styles.aiBadge, { pointerEvents: 'none' }]}>
      {passed ? (
        <View style={[styles.aiInnerBadge, styles.aiPassed]}>
          <Text style={styles.aiBadgeText}>✨ AI Verified</Text>
        </View>
      ) : (
        <View style={[styles.aiInnerBadge, styles.aiWarning]}>
          <Text style={styles.aiBadgeText}>⚠️ Check Quality</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  aiBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    zIndex: 5,
  },
  aiInnerBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiPassed: {
    backgroundColor: '#00C48C', // Premium solid green
  },
  aiWarning: {
    backgroundColor: '#FFB800', // Warning yellow
  },
  aiBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
