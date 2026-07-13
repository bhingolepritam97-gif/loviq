import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Typography, Spacing, Radius } from '../../theme';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Constants from 'expo-constants';

const STEPS_TOTAL = 13;

const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
];

const isExpoGo = Constants.appOwnership === 'expo';
let nativeAuth = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    nativeAuth = require('@react-native-firebase/auth').default;
  } catch (e) {
    console.warn('Native Firebase Auth failed to load:', e);
  }
}

export default function PhoneEmailScreen({ route, navigation }) {
  const isLogin = route.params?.isLogin ?? false;
  const preferPhone = route.params?.preferPhone ?? false;
  const [tab, setTab] = useState(preferPhone ? 'phone' : 'email'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [agreed, setAgreed] = useState(true);
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

  const isValid = tab === 'phone' 
    ? (phone.replace(/\D/g, '').length >= 10 && agreed) 
    : (email.includes('@') && email.includes('.') && agreed);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleContinue = async () => {
    if (!agreed) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (tab === 'phone') {
        const fullPhoneNumber = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;
        
        // Use real Firebase Auth if on Web, else use native Firebase Auth on Android/iOS, else mock for Expo Go
        if (Platform.OS === 'web' && recaptchaVerifier.current) {
          const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier.current);
          navigation.navigate('OTP', { confirmationResult, phone: fullPhoneNumber, isLogin });
        } else if (!isExpoGo && nativeAuth) {
          const confirmationResult = await nativeAuth().signInWithPhoneNumber(fullPhoneNumber);
          navigation.navigate('OTP', { confirmationResult, phone: fullPhoneNumber, isLogin });
        } else {
          setTimeout(() => {
            navigation.navigate('OTP', { phone: fullPhoneNumber, isMock: true, isLogin });
          }, 1000);
        }
      } else {
        // Email & Password flow: Navigate to Password Screen directly
        navigation.navigate('Password', { email, isLogin });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      {Platform.OS === 'web' && <div id="recaptcha-container"></div>}

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top }]}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(1 / STEPS_TOTAL) * 100}%` }]} />
        </View>
      </View>

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0D0D26" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitleText}>Verification</Text>
          <Text style={styles.headerStepText}>Step 1 of 13</Text>
        </View>

        <View style={styles.rightHeaderBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#E91E8C" />
        </View>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block with Illustration */}
        <View style={styles.heroSection}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Let's verify</Text>
            <View style={styles.accentTitleRow}>
              <Text style={styles.heroTitleAccent}>your {tab === 'phone' ? 'number' : 'email'}</Text>
              <Ionicons name="shield-checkmark-outline" size={20} color="#E91E8C" style={styles.shieldIcon} />
            </View>
            <Text style={styles.heroSubtitle}>
              {tab === 'phone' 
                ? "We'll send you a 6-digit verification code to keep your account safe and secure."
                : "Enter your email address to secure your account and verify your identity."}
            </Text>
          </View>
          
          <Image 
            source={require('../../../assets/phone_verification_illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Tab Selection */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'phone' && styles.tabActive]} 
            onPress={() => setTab('phone')}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={tab === 'phone' ? '#E91E8C' : '#8A8A9A'} />
            <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, tab === 'email' && styles.tabActive]} 
            onPress={() => setTab('email')}
          >
            <Ionicons name="mail-outline" size={16} color={tab === 'email' ? '#E91E8C' : '#8A8A9A'} />
            <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Form Inputs */}
        <Text style={styles.inputLabel}>{tab === 'phone' ? 'Phone number' : 'Email address'}</Text>
        
        {tab === 'phone' ? (
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.countryCode} onPress={() => setShowCountries(true)}>
              <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
              <Text style={styles.countryText}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={12} color="#8A8A9A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.phoneInput}
                placeholder={selectedCountry.code === '+1' ? "(555) 000-0000" : "Phone number"}
                placeholderTextColor="#BDBDCF"
                value={phone}
                onChangeText={v => setPhone(formatPhone(v))}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.emailInput}
            placeholder="you@example.com"
            placeholderTextColor="#BDBDCF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        )}

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <View style={styles.safetyIconCircle}>
            <Ionicons name="shield-checkmark" size={18} color="#E91E8C" />
          </View>
          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>Your {tab === 'phone' ? 'number' : 'email'} is safe with us.</Text>
            <Text style={styles.safetySubtitle}>We never share your info with anyone.</Text>
          </View>
        </View>

        {/* Checkbox agreement */}
        <TouchableOpacity 
          style={styles.checkboxRow} 
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <Ionicons 
            name={agreed ? "checkbox" : "square-outline"} 
            size={20} 
            color={agreed ? "#E91E8C" : "#BDBDCF"} 
          />
          <Text style={styles.legalText}>
            By continuing you agree to our{'\n'}
            <Text style={styles.linkText}>Terms of Service</Text> & <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Country Code Modal */}
      {showCountries && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountries(false)}>
                <Ionicons name="close" size={24} color="#0D0D26" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
              {COUNTRIES.map((c, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(c);
                    setShowCountries(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{c.flag}</Text>
                  <Text style={styles.countryItemName}>{c.name}</Text>
                  <Text style={styles.countryItemCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Pill Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity 
          activeOpacity={isValid && !loading ? 0.85 : 1}
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
        >
          <LinearGradient
            colors={isValid && !loading ? ['#E91E8C', '#E91E8C'] : ['#E0E0E0', '#E0E0E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.continueText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.arrowIcon} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Progress & Header
  progressContainer: { width: '100%' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#F0F0F5' },
  progressBarFill: { height: '100%', backgroundColor: '#E91E8C' },
  
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 60 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitleCenter: { alignItems: 'center' },
  headerTitleText: { fontSize: 15, fontWeight: '700', color: '#0D0D26' },
  headerStepText: { fontSize: 11, fontWeight: '700', color: '#E91E8C', marginTop: 1 },
  rightHeaderBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F5', justifyContent: 'center', alignItems: 'center' },

  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  
  // Hero Block
  heroSection: { flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: Spacing.xl },
  heroTextContainer: { flex: 1, paddingRight: Spacing.md },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#0D0D26', letterSpacing: -0.5 },
  accentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  heroTitleAccent: { fontSize: 28, fontWeight: '800', color: '#E91E8C', letterSpacing: -0.5 },
  shieldIcon: { marginTop: 4 },
  heroSubtitle: { fontSize: 13, color: '#7B7B8F', lineHeight: 18, marginTop: Spacing.sm },
  illustration: { width: 90, height: 110 },

  // Custom Tabs selector
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E5E5EA', padding: 4, marginBottom: Spacing.lg, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: '#FFF0F5', borderWidth: 1, borderColor: '#E91E8C' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8A8A9A' },
  tabTextActive: { color: '#E91E8C' },

  // Inputs
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#0D0D26', marginBottom: Spacing.xs },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.lg },
  countryCode: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: Spacing.md, height: 52, gap: 4 },
  flagEmoji: { fontSize: 16 },
  countryText: { fontSize: 15, fontWeight: '600', color: '#0D0D26' },
  phoneInput: { flex: 1, height: 52, backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: Spacing.md, fontSize: 15, color: '#0D0D26' },
  emailInput: { height: 52, backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: Spacing.md, fontSize: 15, color: '#0D0D26', marginBottom: Spacing.lg },

  // Safety Banner
  safetyBanner: { flexDirection: 'row', backgroundColor: '#FFF5F7', padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  safetyIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', ...Shadow.sm },
  safetyTextContainer: { flex: 1 },
  safetyTitle: { fontSize: 12, fontWeight: '700', color: '#0D0D26' },
  safetySubtitle: { fontSize: 11, color: '#7B7B8F', marginTop: 1 },

  // Checkbox legal
  checkboxRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingHorizontal: Spacing.xs },
  legalText: { fontSize: 12, color: '#7B7B8F', lineHeight: 17 },
  linkText: { color: '#E91E8C', fontWeight: '700' },

  errorText: { color: '#FF3A5C', fontSize: 13, marginBottom: Spacing.md, fontWeight: '600' },

  // Footer Continue button
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  continueBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  continueBtnDisabled: { elevation: 0, shadowOpacity: 0 },
  continueGradient: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  arrowIcon: { marginTop: 1 },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D0D26',
  },
  countryList: {
    marginBottom: Spacing.md,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  countryItemName: {
    flex: 1,
    fontSize: 15,
    color: '#0D0D26',
    fontWeight: '600',
  },
  countryItemCode: {
    fontSize: 15,
    color: '#8A8A9A',
    fontWeight: '700',
  },
});
