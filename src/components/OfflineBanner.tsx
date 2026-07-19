import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Shadow } from '../theme';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();
  const { colors: Colors } = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (connected) {
        // Slide out
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // Slide in
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => unsubscribe();
  }, [slideAnim]);

  if (isConnected) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ translateY: slideAnim }],
        paddingTop: Math.max(insets.top, Spacing.sm),
        backgroundColor: Colors.error
      }
    ]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color={Colors.white} style={{ marginRight: Spacing.xs }} />
        <Text style={styles.text}>No internet connection. Showing offline data.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: Spacing.sm,
    ...Shadow.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
