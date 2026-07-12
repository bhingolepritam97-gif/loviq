import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/datingIntent.styles';
import { Colors } from '../../../theme';

export default function ProfileProgress({ selectedCount, percentComplete, remainingCount }) {
  const getRingStyle = () => {
    if (percentComplete > 0) {
      return {
        borderTopColor: Colors.primary,
        borderRightColor: Colors.primary,
        borderBottomColor: Colors.border,
        borderLeftColor: Colors.border,
      };
    }
    return {
      borderColor: Colors.border,
    };
  };

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressLeft}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>🖼️</Text>
        </View>

        <View style={styles.progressStats}>
          <Text style={styles.statsTitle}>
            {selectedCount} of 3 Selected
          </Text>
          <Text style={styles.statsSubtitle}>
            {remainingCount > 0
              ? `Complete ${remainingCount} more to continue`
              : 'Dating intent set! Ready to go'}
          </Text>
        </View>
      </View>

      <View style={styles.progressRight}>
        <View style={styles.progressRingContainer}>
          <View
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 4,
              },
              getRingStyle(),
            ]}
          />
          <Text style={styles.ringText}>{percentComplete}%</Text>
        </View>
        <Text style={styles.progressLabel}>Profile{'\n'}Complete</Text>
      </View>
    </View>
  );
}
export { ProfileProgress };
