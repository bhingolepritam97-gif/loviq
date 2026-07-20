import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../config/firebase';
import { sendSignInLinkToEmail, signInAnonymously } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import i18n from '../../i18n';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

const STEPS_TOTAL = 13;
const CODE_LENGTH = 6;

export default function OTPScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const { setUser } = useAuth();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const insets = useSafeAreaInsets();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const hasVerified = useRef(false);
  const { isPhone } = useBreakpoints();

  const { confirmationResult, phone, isMock, email, isLogin = false, isEmailLink = false } = route.params || {};

  const isComplete = code.every(c => c !== '');

  const handleChange = (val, idx) => {
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    setError('');
    if (val && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!code[idx] && idx > 0 && inputRefs.current[idx - 1]) {
        inputRefs.current[idx - 1].focus();
      }
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (isComplete && !loading) {
      handleVerify();
    }
  }, [code, isComplete, loading]);

  const handleVerify = async () => {
    if (hasVerified.current) return;
    const enteredCode = code.join('');
    setError('');

    if (isMock) {
      if (enteredCode === '123456') {
        hasVerified.current = true;
        setLoading(true);
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (authErr) {
          console.warn('[OTPScreen] Firebase anonymous auth failed, falling back to mock state session:', authErr.message);
          setUser({
            uid: `mock_${phone.replace(/\D/g, '') || Math.random().toString(36).substring(7)}`,
            email: 'mockuser@loviq.app',
            phoneNumber: phone || null,
          });
        } finally {
          setLoading(false);
          if (!isLogin) {
            navigation.navigate('BasicInfo', { phone, email, isMock, isLogin });
          }
        }
      } else {
        setError('Incorrect code. Please try again.');
      }
      return;
    }

    setLoading(true);
    try {
      if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(enteredCode);
        hasVerified.current = true;
        setUser(userCredential.user);
        if (!isLogin) {
          navigation.navigate('BasicInfo', { phone, email, isMock, isLogin });
        }
      } else {
        setError('No active verification session found. Go back and retry.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const confirmationResult = await auth.signInWithPhoneNumber(phone);
      setResendSent(true);
      setResendTimer(60);
    } catch (e) {
      setError('Failed to resend code: ' + e.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    setResendLoading(true);
    try {
      const actionCodeSettings = {
        handleCodeInApp: true,
        url: 'https://loviq-33ac0.firebaseapp.com/emailSignIn',
        android: { packageName: 'com.pritambhingole.Lovly', installApp: true, minimumVersion: '12' },
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('emailForSignIn', email);

      setResendSent(true);
    } catch (e) {
      console.error(e);
      setError('Failed to send magic link: ' + e.message);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (isEmailLink && email) {
      handleResendMagicLink();
    }
  }, [isEmailLink, email]);

  // ── EMAIL MAGIC LINK MODE ──────────────────────────────────────────────────
  if (isEmailLink) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, Colors.background]} style={StyleSheet.absoluteFill} />
        
        <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
          {/* Progress Bar */}
          <View style={[styles.progressContainer, { paddingTop: insets.top }]}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(2 / STEPS_TOTAL) * 100}%` }]} />
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
              <Text style={styles.headerTitleText}>Check Email</Text>
              <Text style={styles.headerStepText}>Step 2 of 13</Text>
            </View>
            <View style={styles.rightHeaderBadge}>
              <Ionicons name="mail-unread" size={16} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.emailLinkContainer}>
            <View style={styles.emailIconWrap}>
              <Ionicons name="mail-outline" size={50} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Check your Inbox</Text>
            <Text style={styles.heroSubtitle}>
              We just sent a magic sign-in link to:{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.emailLinkHint}>
              Tap the link inside the email from your phone, and you will be logged in automatically!
            </Text>

            {resendSent ? (
              <View style={styles.resendRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={[styles.resendText, { color: '#4CAF50', marginLeft: 6, fontWeight: '600' }]}>Link resent!</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.resendRow} 
                onPress={handleResendMagicLink} 
                disabled={resendLoading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Resend magic link"
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Didn't get it? </Text>
                {resendLoading
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Text style={styles.resendLink}>Resend link</Text>
                }
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.wrongEmailBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Wrong email address? Go back to change it"
              activeOpacity={0.7}
            >
              <Text style={styles.wrongEmailText}>Wrong email address?</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveScreen>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.background]} style={StyleSheet.absoluteFill} />
      
      <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { paddingTop: insets.top }]}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(2 / STEPS_TOTAL) * 100}%` }]} />
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
            <Text style={styles.headerStepText}>Step 2 of 13</Text>
          </View>

          <View style={styles.rightHeaderBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
          </View>
        </View>

        {/* Inner Centered Form Container */}
        <View style={styles.innerForm}>
          {/* Title Block with Illustration */}
          <View style={styles.heroSection}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{i18n.t('otp.title')}</Text>
              <Text style={styles.heroSubtitle}>
                {i18n.t('otp.subtitle', { contact: phone })}
              </Text>
            </View>
            
            <Image 
              source={require('../../../assets/otp_illustration.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* 6-Digit input boxes */}
          <View style={styles.codeRow}>
            {code.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(r: any) => (inputRefs.current[idx] = r)}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={v => handleChange(v, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                autoFocus={idx === 0}
                maxLength={1}
                textAlign="center"
                selectionColor={Colors.primary}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Demo Mode Notice */}
          {isMock && (
            <View style={styles.demoBanner}>
              <Ionicons name="information-circle" size={18} color={Colors.primary} />
              <Text style={styles.demoText}>Testing Mode: Enter <Text style={styles.demoCode}>123456</Text> to verify.</Text>
            </View>
          )}

          {resendSent && resendTimer > 0 ? (
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Resend code in {resendTimer}s</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.resendRow} 
              onPress={handlePhoneResend} 
              disabled={resendLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('otp.resend')}
              activeOpacity={0.7}
            >
              <Text style={styles.resendLink}>{i18n.t('otp.resend')}</Text>
            </TouchableOpacity>
          )}

          {/* Floating Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.continueBtn, !isComplete && styles.continueBtnDisabled]}
              disabled={!isComplete || loading}
              onPress={handleVerify}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('otp.continue')}
              activeOpacity={isComplete && !loading ? 0.85 : 1}
            >
              <LinearGradient
                colors={isComplete && !loading ? Gradients.primary.colors : [Colors.border, Colors.border]}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.continueGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.continueText}>{i18n.t('otp.continue')}</Text>
                    <Ionicons name="arrow-forward" size={20} color={isComplete ? Colors.white : Colors.textMuted} style={styles.arrowIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveScreen>
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
  keyIcon: { marginTop: 4 },
  heroSubtitle: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginTop: Spacing.sm },
  illustration: { width: 90, height: 110 },

  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: Spacing.lg },
  codeInput: { flex: 1, height: 56, backgroundColor: Colors.surface, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, textAlign: 'center', fontSize: 24, fontWeight: '700', color: Colors.text },
  codeInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.background },
  
  errorText: { textAlign: 'center', color: Colors.error, fontSize: 13, marginBottom: Spacing.base, fontWeight: '600' },
  
  demoBanner: { flexDirection: 'row', backgroundColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius['2xl'], alignItems: 'center', gap: 8, alignSelf: 'center', marginBottom: Spacing.md },
  demoText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  demoCode: { fontWeight: '800', textDecorationLine: 'underline' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xs },
  resendText: { color: Colors.textMuted, fontSize: 13 },
  resendLink: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  
  footer: { paddingVertical: Spacing.xl },
  continueBtn: { width: '100%', borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  continueBtnDisabled: { elevation: 0, shadowOpacity: 0, ...Platform.select({ web: { cursor: 'default' } as any, default: {} }) },
  continueGradient: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  arrowIcon: { marginTop: 1 },

  emailLinkContainer: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, alignItems: 'center', maxWidth: 480, alignSelf: 'center' },
  emailIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  emailHighlight: { color: Colors.primary, fontWeight: '700' },
  emailLinkHint: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, paddingHorizontal: Spacing.sm },
  wrongEmailBtn: { marginTop: Spacing.xl, paddingVertical: Spacing.md, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  wrongEmailText: { color: Colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
