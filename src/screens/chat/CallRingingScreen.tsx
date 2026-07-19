import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../../components/Avatar';
import { socketService } from '../../api/socket';

export default function CallRingingScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { profile, callType = 'video', isIncoming = false } = route.params || {};

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();

    const socket = socketService.getSocket();

    // Outgoing call: notify the backend socket to alert the recipient
    if (!isIncoming && socket && profile?.id) {
      socket.emit("call_user", { targetUserId: profile.id, callType });
    }

    // Register active calling listeners
    if (socket) {
      socket.on("call_accepted", () => {
        navigation.replace('ActiveCall', { profile, callType, isInitiator: true });
      });
      socket.on("call_ended", () => {
        navigation.goBack();
      });
    }

    return () => {
      if (socket) {
        socket.off("call_accepted");
        socket.off("call_ended");
      }
    };
  }, [isIncoming, profile, callType]);

  const handleAccept = () => {
    const socket = socketService.getSocket();
    if (socket && profile?.id) {
      socket.emit("accept_call", { targetUserId: profile.id });
    }
    navigation.replace('ActiveCall', { profile, callType, isInitiator: false });
  };

  const handleDecline = () => {
    const socket = socketService.getSocket();
    if (socket && profile?.id) {
      socket.emit("end_call", { targetUserId: profile.id });
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.callingText}>{isIncoming ? "Incoming call..." : "Ringing..."}</Text>
        <Text style={styles.nameText}>{profile?.name}</Text>
      </View>

      <View style={styles.centerContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.avatarWrap}>
          <Avatar uri={profile?.photos?.[0]} size={140} />
        </View>
      </View>

      <View style={styles.controls}>
        {isIncoming ? (
          <View style={styles.incomingControlsRow}>
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Decline call" style={[styles.btn, styles.declineBtn]} onPress={handleDecline}>
              <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Accept call" style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
              <Ionicons name="call" size={32} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Decline call" style={[styles.btn, styles.declineBtn]} onPress={handleDecline}>
            <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: Spacing.xl * 2 },
  callingText: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  nameText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarWrap: { borderRadius: 70, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  
  controls: { alignItems: 'center', paddingBottom: Spacing.xl * 2 },
  incomingControlsRow: { flexDirection: 'row', gap: Spacing.xl * 2 },
  btn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { backgroundColor: Colors.error },
  acceptBtn: { backgroundColor: '#4CD964' } // iOS call-answer green
});
