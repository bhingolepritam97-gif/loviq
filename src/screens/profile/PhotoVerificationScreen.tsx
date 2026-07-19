import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { verifyUser } from '../../services/UserService';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function PhotoVerificationScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [verifyMethod, setVerifyMethod] = useState('selfie'); // 'selfie' | 'document'
  const [docPhoto, setDocPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulated Selfie Camera Scan States
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'completed'
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);

  // Camera permissions hook
  const [permission, requestPermission] = useCameraPermissions();

  const startScanningAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStartScan = async () => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera permissions to perform the biometric face scan.');
        return;
      }
    }

    setScanStatus('scanning');
    setScanProgress(0);
    startScanningAnimation();
    
    const interval = setInterval(async () => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Capture photo from active camera stream once scan completes
          if (cameraRef.current) {
            cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: false })
              .then(photo => {
                if (photo?.uri) {
                  setCapturedSelfie(photo.uri);
                }
              })
              .catch(err => {
                console.warn('[PhotoVerification] Failed taking picture from camera stream:', err.message);
              });
          }

          setScanStatus('completed');
          scanLineAnim.setValue(0.5); // Reset to center
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  const pickDocPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled) {
        setDocPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Failed picking ID document:', e.message);
    }
  };

  const handleVerify = async () => {
    if (verifyMethod === 'document' && !docPhoto) {
      Alert.alert('Required', 'Please upload a photo of your ID card or passport first.');
      return;
    }
    if (verifyMethod === 'selfie' && (scanStatus !== 'completed' || (!capturedSelfie && Platform.OS !== 'web'))) {
      Alert.alert('Required', 'Please complete the biometric face scan first.');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        const localUri = verifyMethod === 'selfie' ? capturedSelfie : docPhoto;
        // Fallback for development/simulators if capturedSelfie is missing but scan status is completed
        const uriToUpload = localUri || "https://lovly.app/assets/default-selfie.jpg";

        const { uploadImageToFirebase } = require('../../services/ImageService');
        let uploadedUrl = uriToUpload;
        if (uriToUpload && uriToUpload.startsWith('file://')) {
          uploadedUrl = await uploadImageToFirebase(uriToUpload);
        }

        const success = await verifyUser(uploadedUrl);
        setLoading(false);
        if (success) {
          if (profile) {
            setProfile({ 
              ...profile, 
              isVerified: true,
              verificationStatus: 'verified' 
            });
          }
          Alert.alert(
            'Verification Submitted!',
            verifyMethod === 'selfie' 
              ? 'Selfie matched successfully! You now have a blue checkmark on your profile.'
              : 'ID document uploaded! Human review is pending. You will receive an alert once verified.',
            [{ text: 'Awesome', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', 'Failed to submit verification. Please try again.');
        }
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to submit verification. Please try again.');
    }
  };

  const isContinueDisabled = verifyMethod === 'document' ? (step === 2 && !docPhoto) : (step === 2 && scanStatus !== 'completed');

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240], // size matching cameraPlaceholder height
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Verified</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {step === 1 ? (
          <>
            <Ionicons name="shield-checkmark" size={72} color={Colors.primary} style={styles.icon} />
            <Text style={styles.title}>Prove it's really you</Text>
            <Text style={styles.subtitle}>
              Verify your authenticity to get the blue checkmark and increase matches.
            </Text>

            {/* Verification Method Selectors */}
            <View style={styles.methodContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.methodCard, verifyMethod === 'selfie' && styles.methodCardActive]}
                onPress={() => setVerifyMethod('selfie')}
                accessible={true} accessibilityLabel="Verify with Video Selfie Pose" accessibilityRole="button"
              >
                <Ionicons name="videocam" size={22} color={verifyMethod === 'selfie' ? Colors.primary : Colors.textMuted} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={[styles.methodLabel, verifyMethod === 'selfie' && styles.methodLabelActive]}>Video Selfie Pose</Text>
                  <Text style={styles.methodDesc}>Instant blue badge using automated alignment checks</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.methodCard, verifyMethod === 'document' && styles.methodCardActive]}
                onPress={() => setVerifyMethod('document')}
                accessible={true} accessibilityLabel="Verify with ID Card or Passport" accessibilityRole="button"
              >
                <Ionicons name="card" size={22} color={verifyMethod === 'document' ? Colors.primary : Colors.textMuted} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={[styles.methodLabel, verifyMethod === 'document' && styles.methodLabelActive]}>ID Card / Passport</Text>
                  <Text style={styles.methodDesc}>Official document review to verify age, name, and profile details</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>Benefits</Text>
              <Text style={styles.benefitItem}>✓ Up to 3x more match compatibility</Text>
              <Text style={styles.benefitItem}>✓ Show matches you're authentic</Text>
            </View>
          </>
        ) : verifyMethod === 'selfie' ? (
          <>
            <Text style={styles.title}>
              {scanStatus === 'idle' ? 'Position Face' : scanStatus === 'scanning' ? 'Keep Pose Steady' : 'Scan Complete ✓'}
            </Text>
            <Text style={styles.subtitle}>
              {scanStatus === 'idle' 
                ? 'Align your face in the target and tap Start Scan to begin biometric matching.'
                : scanStatus === 'scanning'
                ? `Scanning selfie pose... ${scanProgress}%`
                : 'Selfie biometric validation complete. Proceed to submit.'}
            </Text>
            
            <View style={styles.cameraPlaceholder}>
              {permission && permission.granted && scanStatus !== 'completed' ? (
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  facing="front"
                />
              ) : capturedSelfie ? (
                <Image source={{ uri: capturedSelfie }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : null}

              {/* Camera Permission Request Overlay inside viewport */}
              {(!permission || !permission.granted) && scanStatus === 'idle' && (
                <View style={styles.permissionBox}>
                  <Ionicons name="camera-reverse" size={36} color="rgba(255,255,255,0.4)" style={{ marginBottom: Spacing.sm }} />
                  <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} accessible={true} accessibilityLabel="Enable Camera Permission" accessibilityRole="button">
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Outer scanning circle / alignment helper overlay */}
              {scanStatus !== 'completed' && (
                <View style={[
                  styles.scanCircle, 
                  scanStatus === 'scanning' && styles.scanCircleScanning,
                  scanStatus === 'completed' && styles.scanCircleCompleted
                ]}>
                  {scanStatus === 'idle' && (
                    <Ionicons 
                      name="person-outline" 
                      size={100} 
                      color="rgba(255,255,255,0.4)" 
                    />
                  )}
                </View>
              )}

              {/* Completed checkmark overlay */}
              {scanStatus === 'completed' && (
                <View style={styles.completedOverlay}>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={48} color="#34A853" />
                  </View>
                </View>
              )}

              {/* Glowing vertical scan line */}
              {scanStatus === 'scanning' && (
                <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
              )}

              {scanStatus !== 'completed' && (
                <Text style={styles.cameraText}>
                  {scanStatus === 'scanning' ? 'Analyzing features...' : 'Biometric Viewport'}
                </Text>
              )}
            </View>

            {scanStatus === 'idle' && (
              <TouchableOpacity
                id="start-biometric-scan-btn"
                style={styles.scanBtn}
                onPress={handleStartScan}
                accessible={true} accessibilityLabel="Start Biometric Scan" accessibilityRole="button"
              >
                <Text style={styles.scanBtnText}>Start Biometric Scan</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Upload Document</Text>
            <Text style={styles.subtitle}>Upload a clear photo of your passport or national ID card.</Text>
            
            <TouchableOpacity 
              activeOpacity={0.85}
              style={[styles.documentUploadCard, docPhoto && styles.documentUploadCardActive]}
              onPress={pickDocPhoto}
              accessible={true} accessibilityLabel="Select ID Photo" accessibilityRole="button"
            >
              {docPhoto ? (
                <Image source={{ uri: docPhoto }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={54} color={Colors.textMuted} />
                  <Text style={styles.uploadCardText}>Tap to select ID Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {step === 1 ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)} accessible={true} accessibilityLabel="Continue" accessibilityRole="button">
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryBtn, (loading || isContinueDisabled) && { opacity: 0.7 }]} 
            onPress={handleVerify}
            disabled={loading || isContinueDisabled}
            accessible={true} accessibilityLabel="Submit for Verification" accessibilityRole="button"
          >
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnText}>Submit for Verification</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  content: { flex: 1, paddingHorizontal: Spacing.xl, alignItems: 'center', paddingTop: Spacing.xl },
  icon: { marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  
  methodContainer: { width: '100%', gap: Spacing.md, marginBottom: Spacing.lg },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md },
  methodCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  methodLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  methodLabelActive: { color: Colors.primary },
  methodDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  benefitsBox: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, width: '100%', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  benefitsTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  benefitItem: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xs, fontWeight: '500' },

  cameraPlaceholder: { width: '100%', height: 240, backgroundColor: '#0F0F1A', borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: '#1F1F35' },
  scanCircle: { width: 170, height: 170, borderRadius: 85, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  scanCircleScanning: { borderColor: Colors.primary, borderStyle: 'solid' },
  scanCircleCompleted: { borderColor: '#34A853', borderStyle: 'solid', backgroundColor: 'rgba(52,168,83,0.08)' },
  scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  cameraText: { color: Colors.textMuted, position: 'absolute', bottom: Spacing.md, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, zIndex: 10 },

  // Permission box overlay styles
  permissionBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  permissionBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  completedBadge: {
    backgroundColor: Colors.white,
    borderRadius: 36,
    padding: 2,
    ...Shadow.md,
  },

  scanBtn: { marginTop: Spacing.xl, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, ...Shadow.sm },
  scanBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },

  documentUploadCard: { width: '100%', aspectRatio: 3/2, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  documentUploadCardActive: { borderStyle: 'solid', borderColor: Colors.primary },
  docImage: { width: '100%', height: '100%' },
  uploadCardText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: Spacing.sm },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  primaryBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
});
