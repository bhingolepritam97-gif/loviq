import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import OnboardingHeader from '../../components/OnboardingHeader';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const STEPS_TOTAL = 12;

export default function PhoneEmailScreen({ navigation }) {
  const [tab, setTab] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  
  const recaptchaVerifier = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && auth) {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      recaptchaVerifier.current = window.recaptchaVerifier;
    }
  }, []);

  const isValid = tab === 'phone' ? phone.replace(/\D/g, '').length >= 10 : email.includes('@') && email.includes('.');

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleContinue = async () => {
    setError('');
    setLoading(true);
    try {
      if (tab === 'phone') {
        const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;
        
        // Use real Firebase Auth if on Web, else mock for mobile (requires native setup)
        if (Platform.OS === 'web' && recaptchaVerifier.current) {
          const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier.current);
          navigation.navigate('OTP', { confirmationResult, phone: fullPhoneNumber });
        } else {
          console.log('Mobile detected or missing recaptcha. Simulating phone auth send...');
          setTimeout(() => {
            navigation.navigate('OTP', { phone: fullPhoneNumber, isMock: true });
          }, 1000);
        }
      } else {
        // Email logic would go here
        navigation.navigate('OTP', { email, isMock: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={1}
        totalSteps={STEPS_TOTAL}
        title="Verification"
        subtitle="Step 1 of 3"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>My number is</Text>
        <Text style={styles.subtitle}>We'll send you a verification code to keep your account safe.</Text>

        <View style={styles.tabs}>
          {['phone', 'email'].map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'phone' ? '📱 Phone' : '📧 Email'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && <Text style={{ color: Colors.error, marginBottom: Spacing.md }}>{error}</Text>}

        {tab === 'phone' ? (
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.countryCode}>
              <Text style={styles.countryText}>{countryCode}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="(555) 000-0000"
                value={phone}
                onChangeText={v => setPhone(formatPhone(v))}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
        ) : (
          <Input
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        )}

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button 
          label={loading ? "Sending..." : "Continue →"} 
          onPress={handleContinue} 
          disabled={!isValid || loading} 
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg },
  backBtn: { marginBottom: Spacing['2xl'] },
  backIcon: { fontSize: 24, color: Colors.text },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Spacing['2xl'] },
  tabs: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: Radius.full, padding: Spacing.xs, marginBottom: Spacing.xl },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.white },
  tabText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  phoneRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  countryCode: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.base, height: 56, gap: Spacing.xs },
  countryText: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.text },
  chevron: { color: Colors.textMuted, fontSize: 12 },
  legal: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: Spacing.xl, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
