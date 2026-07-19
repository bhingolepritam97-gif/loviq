import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineNotice() {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  
  const translateY = useSharedValue(-100);

  // Determine offline state. Consider null as connected until proven otherwise to prevent initial flicker.
  const isOffline = netInfo.isConnected === false && netInfo.isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [isOffline, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + Spacing.sm }, animatedStyle]}>
      <Ionicons name="cloud-offline" size={20} color={Colors.white} style={styles.icon} />
      <Text style={styles.text}>No Internet Connection</Text>
    </Animated.View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.error,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
