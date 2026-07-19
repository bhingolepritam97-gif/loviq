import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography, Spacing, Radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function UploadOverlay({ progress }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const percent = Math.round(progress * 100);

  return (
    <View style={[styles.cardLoaderOverlay, { pointerEvents: 'none' }]}>
      <ActivityIndicator color={Colors.white} size="small" />
      <Text style={styles.uploadingText}>Uploading...</Text>
      
      {/* Mini Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>{percent}%</Text>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  cardLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  uploadingText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    height: 4,
    width: '75%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radius.full,
    marginVertical: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
  },
  progressText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
});
