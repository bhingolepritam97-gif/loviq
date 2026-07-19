import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadow, Spacing, Radius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../../components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';
import { socketService } from '../../api/socket';

let RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription;
let hasWebRTC = false;

try {
  const WebRTC = require('react-native-webrtc');
  RTCPeerConnection = WebRTC.RTCPeerConnection;
  RTCView = WebRTC.RTCView;
  mediaDevices = WebRTC.mediaDevices;
  RTCIceCandidate = WebRTC.RTCIceCandidate;
  RTCSessionDescription = WebRTC.RTCSessionDescription;
  hasWebRTC = true;
} catch (e) {
  console.warn("WebRTC native modules are not available in this runtime (likely running inside Expo Go). Calling screens will use fallback views.");
}

const { width } = Dimensions.get('window');

export default function ActiveCallScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();

  if (!hasWebRTC) {
    const { profile } = route.params || {};
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.background }]}>
        <Ionicons name="videocam-off-outline" size={64} color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md }}>WebRTC Calling Unavailable</Text>
        <Text style={{ fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl }}>
          Native calling features require a custom developer build. Standard Expo Go does not compile the WebRTC binaries.
        </Text>
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()} 
          style={{ paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.full, ...Shadow.sm }}
        >
          <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const { profile, callType = 'video', isInitiator = false, signalData } = route.params || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    const socket = socketService.getSocket();

    const startWebRTC = async () => {
      // 1. Get user media stream
      let stream;
      try {
        const isVideo = callType === 'video';
        stream = await mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? {
            facingMode: 'user',
            width: 640,
            height: 480,
            frameRate: 30
          } : false
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (err) {
        console.warn('Failed to get media devices:', err.message);
      }

      // 2. Initialize Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // 3. Add local stream tracks to connection
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }

      // 4. Handle remote track additions
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      let isRemoteDescriptionSet = false;
      const pendingCandidates = [];

      // 5. Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && profile?.id) {
          socket.emit("webrtc_ice", { targetUserId: profile.id, candidate: event.candidate });
        }
      };

      // 5.5 ICE Connection State
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          console.warn("[WebRTC] Connection failed or disconnected.");
          navigation.goBack();
        }
      };

      // 6. Bind signaling listeners on Socket
      if (socket) {
        const drainIceQueue = async () => {
          isRemoteDescriptionSet = true;
          for (let cand of pendingCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.warn('Failed adding queued ICE candidate:', err.message);
            }
          }
          pendingCandidates.length = 0;
        };

        // Relay ICE candidates
        socket.on("webrtc_ice", async ({ candidate }) => {
          if (isRemoteDescriptionSet) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Failed adding remote ICE candidate:', err.message);
            }
          } else {
            pendingCandidates.push(candidate);
          }
        });

        // If recipient: handle incoming offer
        if (!isInitiator) {
          socket.on("webrtc_offer", async ({ signalData: offer }) => {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              await drainIceQueue();
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit("webrtc_answer", { targetUserId: profile.id, signalData: answer });
            } catch (e) {
              console.warn('WebRTC recipient handshake error:', e.message);
            }
          });
        }

        // If initiator: send offer and handle answer
        if (isInitiator) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc_offer", { targetUserId: profile.id, signalData: offer });
          } catch (e) {
            console.warn('WebRTC initiator handshake offer error:', e.message);
          }

          socket.on("webrtc_answer", async ({ signalData: answer }) => {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              await drainIceQueue();
            } catch (e) {
              console.warn('WebRTC initiator handle answer error:', e.message);
            }
          });
        }

        socket.on("call_ended", () => {
          navigation.goBack();
        });
        socket.on("disconnect", () => {
          console.warn("[WebRTC] Socket disconnected, ending call.");
          navigation.goBack();
        });
      }
    };

    startWebRTC();

    return () => {
      clearInterval(timer);
      
      // Clean up socket listeners
      if (socket) {
        socket.off("webrtc_ice");
        socket.off("webrtc_offer");
        socket.off("webrtc_answer");
        socket.off("call_ended");
        socket.off("disconnect");
      }

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Close connection
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [isInitiator, signalData, profile, callType]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
  };

  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !nextVideoOff;
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    const socket = socketService.getSocket();
    if (socket && profile?.id) {
      socket.emit("end_call", { targetUserId: profile.id });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND / MAIN FEED */}
      {callType === 'video' && remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.mainVideo} objectFit="cover" />
      ) : callType === 'video' && !isVideoOff ? (
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

      {/* PIP MY CAMERA */}
      {callType === 'video' && (
        <View style={[styles.pipContainer, { top: insets.top + 60 }]}>
          {isVideoOff || !localStream ? (
            <View style={[styles.pipFrame, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="videocam-off" size={24} color="#FFF" />
            </View>
          ) : (
            <RTCView streamURL={localStream.toURL()} style={styles.pipFrame} objectFit="cover" />
          )}
        </View>
      )}

      {/* CONTROLS */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={[styles.controlsOverlay, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel={isMuted ? "Unmute audio" : "Mute audio"} style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={Colors.white} />
          </TouchableOpacity>
          
          {callType === 'video' && (
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel={isVideoOff ? "Turn on video" : "Turn off video"} style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} onPress={toggleVideo}>
              <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={Colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="End call" style={[styles.controlBtn, styles.endCallBtn]} onPress={handleEndCall}>
            <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mainVideo: { width: '100%', height: '100%', resizeMode: 'cover' },
  audioBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0E1A' },
  audioName: { color: Colors.white, fontSize: 24, fontWeight: '700', marginTop: Spacing.lg },
  
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, height: 120, alignItems: 'center' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EA4335', marginRight: 8 },
  timerText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  pipContainer: { position: 'absolute', right: Spacing.lg, width: width * 0.28, aspectRatio: 3/4, borderRadius: Radius.md, overflow: 'hidden', ...Shadow.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  pipFrame: { width: '100%', height: '100%' },

  controlsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, justifyContent: 'flex-end', paddingHorizontal: Spacing.xl },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderStyle: 'solid', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  controlBtnActive: { backgroundColor: '#EA4335', borderColor: '#EA4335' },
  endCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EA4335', borderColor: '#EA4335' }
});
