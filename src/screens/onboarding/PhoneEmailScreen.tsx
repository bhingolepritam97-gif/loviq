import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image, TextInput, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Shadow, Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Constants from 'expo-constants';
import BrandIcon from '../../components/brand/BrandIcon';
import { Brand } from '../../components/brand/brand';
import i18n from '../../i18n';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

const STEPS_TOTAL = 13;

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
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

const isExpoGo = (Constants.executionEnvironment as string) === 'store-client' || Constants.appOwnership === 'expo';
let nativeAuth = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    nativeAuth = require('@react-native-firebase/auth').default;
  } catch (e) {
    console.warn('Native Firebase Auth failed to load:', e);
  }
}

export default function PhoneEmailScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const preferPhone = route.params?.preferPhone ?? false;
  const [tab, setTab] = useState<'phone' | 'email'>(preferPhone ? 'phone' : 'email');
  const isLogin = route.params?.isLogin ?? false;
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoints();
  
  const recaptchaVerifier = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && auth) {
      const win = window as any;
      if (!win.recaptchaVerifier) {
        win.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      recaptchaVerifier.current = win.recaptchaVerifier;
    }
  }, []);

  const isValidEmail = (val: string) => {
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return reg.test(val);
  };

  const isValid = tab === 'phone'
    ? phone.replace(/\D/g, '').length >= 10 && agreed
    : isValidEmail(email) && agreed;

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
        setTimeout(() => {
          navigation.navigate('Password', { email, isLogin });
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.background]} style={StyleSheet.absoluteFill} />
      {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
      
      <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { paddingTop: insets.top }]}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(1 / STEPS_TOTAL) * 100}%` }]} />
          </View>
        </View>

        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitleText}>Verification</Text>
            <Text style={styles.headerStepText}>Step 1 of 13</Text>
          </View>

          <View style={styles.rightHeaderBadge}>
            <BrandIcon size="sm" variant="dark" />
          </View>
        </View>

        {/* Inner Centered Form Container */}
        <View style={styles.innerForm}>
          {/* Title Block with Illustration */}
          <View style={styles.heroSection}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{i18n.t('phone.title')}</Text>
              <View style={styles.accentTitleRow}>
                <Text style={styles.heroTitleAccent}>{tab === 'phone' ? 'number' : 'email'}</Text>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} style={styles.shieldIcon} />
              </View>
              <Text style={styles.heroSubtitle}>
                {tab === 'phone'
                  ? i18n.t('phone.subtitle')
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
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="Phone Number Verification Tab"
              accessibilityState={{ selected: tab === 'phone' }}
              activeOpacity={0.7}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={tab === 'phone' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>Phone</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, tab === 'email' && styles.tabActive]} 
              onPress={() => setTab('email')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="Email Address Verification Tab"
              accessibilityState={{ selected: tab === 'email' }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={16} color={tab === 'email' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Error Text */}
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* Input label */}
          <Text style={styles.inputLabel}>{tab === 'phone' ? 'Phone number' : 'Email address'}</Text>
          
          {/* Inputs */}
          {tab === 'phone' ? (
            <View style={styles.phoneRow}>
              <TouchableOpacity 
                style={styles.countryCode} 
                onPress={() => setShowCountries(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Select Country Code, current is ${selectedCountry.name}`}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                <Text style={styles.countryText}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder={selectedCountry.code === '+1' ? "(555) 000-0000" : "Phone number"}
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={v => setPhone(formatPhone(v))}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                  selectionColor={Colors.primary}
                />
              </View>
            </View>
          ) : (
            <TextInput
              style={styles.emailInput}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              selectionColor={Colors.primary}
            />
          )}

          {/* Safety Banner */}
          <View style={styles.safetyBanner}>
            <View style={styles.safetyIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            </View>
            <View style={styles.safetyTextContainer}>
              <Text style={styles.safetyTitle}>Your {tab === 'phone' ? 'phone number' : 'email address'} is safe with us.</Text>
              <Text style={styles.safetySubtitle}>We never share your info with anyone.</Text>
            </View>
          </View>

          {/* Checkbox agreement */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.8}
            onPress={() => setAgreed(!agreed)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={agreed ? "Agree to terms, checked" : "Agree to terms, unchecked"}
          >
            <Ionicons 
              name={agreed ? "checkbox" : "square-outline"} 
              size={20} 
              color={agreed ? Colors.primary : Colors.textLight} 
            />
            <Text style={styles.legalText}>
              By continuing you agree to our{'/n'}
              <Text style={styles.linkText}>Terms of Service</Text> & <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Action button inside form for better positioning */}
          <View style={styles.footer}>
            <TouchableOpacity 
              activeOpacity={isValid && !loading ? 0.85 : 1}
              style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isValid || loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <LinearGradient
                colors={isValid && !loading ? Gradients.primary.colors : [Colors.border, Colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.continueText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} style={styles.arrowIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveScreen>

      {/* Country Code Modal */}
      {showCountries && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Select Country</Text>
              <TouchableOpacity 
                onPress={() => setShowCountries(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close country code selector"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
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
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select country: ${c.name}, code ${c.code}`}
                  activeOpacity={0.7}
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
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  progressContainer: { width: '100%' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: Colors.border },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 60, width: '100%', maxWidth: 480, alignSelf: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  headerTitleCenter: { alignItems: 'center' },
  headerTitleText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerStepText: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginTop: 1 },
  rightHeaderBadge: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },

  innerForm: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  
  heroSection: { flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: Spacing.xl },
  heroTextContainer: { flex: 1, paddingRight: Spacing.md },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  accentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  heroTitleAccent: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  shieldIcon: { marginTop: 4 },
  heroSubtitle: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginTop: Spacing.sm },
  illustration: { width: 90, height: 110 },

  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, padding: 4, marginBottom: Spacing.lg, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', height: 40, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', gap: 6, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  tabActive: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.lg },
  countryCode: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 52, gap: 4, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  flagEmoji: { fontSize: 16 },
  countryText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  phoneInput: { flex: 1, height: 52, backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, fontSize: 15, color: Colors.text },
  emailInput: { height: 52, backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, fontSize: 15, color: Colors.text, marginBottom: Spacing.lg },

  safetyBanner: { flexDirection: 'row', backgroundColor: Colors.border, padding: Spacing.md, borderRadius: Radius['2xl'], alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  safetyIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.sm },
  safetyTextContainer: { flex: 1 },
  safetyTitle: { fontSize: 12, fontWeight: '700', color: Colors.text },
  safetySubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  checkboxRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingHorizontal: Spacing.xs, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  legalText: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  linkText: { color: Colors.primary, fontWeight: '700' },

  errorText: { color: Colors.error, fontSize: 13, marginBottom: Spacing.md, fontWeight: '600' },

  footer: { paddingVertical: Spacing.xl },
  continueBtn: { width: '100%', borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  continueBtnDisabled: { elevation: 0, shadowOpacity: 0, ...Platform.select({ web: { cursor: 'default' } as any, default: {} }) },
  continueGradient: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  arrowIcon: { marginTop: 1 },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    maxHeight: '60%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  countryList: {
    marginBottom: Spacing.md,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  countryItemName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  countryItemCode: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
