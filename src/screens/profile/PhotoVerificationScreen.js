import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { verifyUser } from '../../services/UserService';

export default function PhotoVerificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    // Simulate AI processing time
    setTimeout(async () => {
      if (user) {
        const success = await verifyUser(user.uid);
        setLoading(false);
        if (success) {
          Alert.alert(
            'Verification Successful!',
            'You now have a blue checkmark on your profile.',
            [{ text: 'Awesome', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', 'Failed to verify profile. Please try again.');
        }
      }
    }, 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Verified</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {step === 1 ? (
          <>
            <Ionicons name="shield-checkmark" size={80} color={Colors.primary} style={styles.icon} />
            <Text style={styles.title}>Prove it's really you</Text>
            <Text style={styles.subtitle}>
              Take a quick video selfie matching the pose on the screen. It won't be added to your profile.
            </Text>
            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>Why get verified?</Text>
              <Text style={styles.benefitItem}>✓ Get more matches (up to 3x more!)</Text>
              <Text style={styles.benefitItem}>✓ Show others you're authentic</Text>
              <Text style={styles.benefitItem}>✓ Access exclusive filters</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Copy this pose</Text>
            <Text style={styles.subtitle}>Hold the phone at eye level and copy the pose below.</Text>
            
            <View style={styles.cameraPlaceholder}>
              <View style={styles.poseOverlay}>
                <Ionicons name="body-outline" size={120} color="rgba(255,255,255,0.8)" />
              </View>
              <Text style={styles.cameraText}>Camera View Placeholder</Text>
            </View>
          </>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {step === 1 ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
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
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
            onPress={handleVerify}
            disabled={loading}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  content: { flex: 1, paddingHorizontal: Spacing.xl, alignItems: 'center', paddingTop: Spacing.xl * 2 },
  icon: { marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl * 1.5 },
  
  benefitsBox: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: Radius.lg, width: '100%', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  benefitsTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  benefitItem: { fontSize: 15, color: Colors.text, marginBottom: Spacing.sm, fontWeight: '500' },

  cameraPlaceholder: { width: '100%', aspectRatio: 3/4, backgroundColor: '#1a1a1a', borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  poseOverlay: { position: 'absolute', ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  cameraText: { color: Colors.textMuted, position: 'absolute', bottom: Spacing.lg },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  primaryBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
});
