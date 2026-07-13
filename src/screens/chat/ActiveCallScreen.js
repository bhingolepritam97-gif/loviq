import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, Spacing, Radius } from '../../theme';
import Avatar from '../../components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ActiveCallScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, callType = 'video' } = route.params || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND / MAIN FEED */}
      {callType === 'video' && !isVideoOff ? (
        <Image source={{ uri: profile?.photos?.[0] }} style={styles.mainVideo} blurRadius={0} />
      ) : (
        <View style={styles.audioBg}>
          <Avatar uri={profile?.photos?.[0]} size={160} />
          <Text style={styles.audioName}>{profile?.name}</Text>
        </View>
      )}

      {/* HEADER / TIMER */}
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={[styles.headerOverlay, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.timerBadge}>
          <View style={styles.recordingDot} />
          <Text style={styles.timerText}>{formatTime(duration)}</Text>
        </View>
      </LinearGradient>

      {/* PIP MY CAMERA (Mock) */}
      {callType === 'video' && (
        <View style={[styles.pipContainer, { top: insets.top + 60 }]}>
          {isVideoOff ? (
            <View style={[styles.pipFrame, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="videocam-off" size={24} color="#FFF" />
            </View>
          ) : (
            <Image source={{ uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300' }} style={styles.pipFrame} />
          )}
        </View>
      )}

      {/* CONTROLS */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={[styles.controlsOverlay, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={() => setIsMuted(!isMuted)}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={Colors.white} />
          </TouchableOpacity>
          
          {callType === 'video' && (
            <TouchableOpacity style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} onPress={() => setIsVideoOff(!isVideoOff)}>
              <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={Colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={handleEndCall}>
            <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mainVideo: { width: '100%', height: '100%', resizeMode: 'cover' },
  audioBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' },
  audioName: { color: '#FFF', fontSize: 24, fontWeight: '700', marginTop: Spacing.lg },
  
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, alignItems: 'center' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, marginRight: 8 },
  timerText: { color: '#FFF', fontWeight: '600', fontSize: 14, fontVariant: ['tabular-nums'] },

  pipContainer: { position: 'absolute', right: Spacing.lg, width: 100, height: 150, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', ...Shadow.md },
  pipFrame: { width: '100%', height: '100%', resizeMode: 'cover' },

  controlsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, justifyContent: 'flex-end', alignItems: 'center' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: Colors.white },
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.error }
});
