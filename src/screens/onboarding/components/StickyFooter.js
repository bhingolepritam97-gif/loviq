import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/datingIntent.styles';
import ProfileProgress from './ProfileProgress';
import ContinueButton from './ContinueButton';
import { Spacing } from '../../../theme';

export default function StickyFooter({
  selectedCount,
  percentComplete,
  remainingCount,
  totalRequired = 3,
  isEnabled,
  onPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footerContainer,
        { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.md },
      ]}
    >
      {/* Profile completion stats */}
      <ProfileProgress
        selectedCount={selectedCount}
        percentComplete={percentComplete}
        remainingCount={remainingCount}
        totalRequired={totalRequired}
      />

      {/* Action Button */}
      <ContinueButton isEnabled={isEnabled} onPress={onPress} />

      {/* Lock Secure Message */}
      <View style={styles.secureRow}>
        <Text style={styles.secureIcon}>🔒</Text>
        <Text style={styles.secureText}>Your info is private and secure</Text>
      </View>
    </View>
  );
}
export { StickyFooter };
