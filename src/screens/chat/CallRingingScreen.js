import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../theme';
import Avatar from '../../components/Avatar';

export default function CallRingingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, callType } = route.params || {};

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Mock connection: automatically pick up after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('ActiveCall', { profile, callType });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.callingText}>Calling...</Text>
        <Text style={styles.nameText}>{profile?.name}</Text>
      </View>

      <View style={styles.centerContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.avatarWrap}>
          <Avatar uri={profile?.photos?.[0]} size={140} />
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.endBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: Spacing.xl * 2 },
  callingText: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  nameText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarWrap: { borderRadius: 70, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  
  controls: { alignItems: 'center', paddingBottom: Spacing.xl * 2 },
  endBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center' }
});
