import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Typography, Spacing, Radius } from '../../theme';
import Input from '../../components/Input';
import OnboardingHeader from '../../components/OnboardingHeader';
import { auth } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const STEPS_TOTAL = 13;

export default function PasswordScreen({ route, navigation }) {
  const { isLogin = false, email = '' } = route.params || {};
  const [isLoginState, setIsLoginState] = useState(isLogin);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const isStrong = password.length >= 8;
  const isMatch = password === confirm && confirm.length > 0;
  const canContinue = isLoginState ? password.length > 0 : (isStrong && isMatch);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', '#FF3A5C', '#FFA000', '#4CAF50'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (isLoginState) {
        // Log in an existing user
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register a new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        navigation.navigate('Name');
      }
    } catch (err) {
      console.error(err);
      let cleanMessage = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        cleanMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        cleanMessage = 'No account found with this email.';
      } else if (err.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Email already registered',
          'This email is already in use. Would you like to log in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: () => setIsLoginState(true) }
          ]
        );
        return; // Don't trigger the general alert below
      }
      Alert.alert('Authentication Error', cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset Link Sent',
        `We have sent a password reset link to ${email}. Please check your inbox (including spam) to reset your password.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error(err);
      let cleanMessage = err.message;
      if (err.code === 'auth/user-not-found') {
        cleanMessage = 'No account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        cleanMessage = 'Please enter a valid email address.';
      }
      Alert.alert('Error', cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#FFF8F8', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      {isLoginState ? (
        <View style={[styles.loginHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <Ionicons name="arrow-back" size={24} color="#0D0D26" />
          </TouchableOpacity>
        </View>
      ) : (
        <OnboardingHeader
          onBack={() => navigation.goBack()}
          currentStep={3}
          totalSteps={STEPS_TOTAL}
          title="Security"
        />
      )}

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{isLoginState ? "Welcome back" : "Create a password"}</Text>
        <Text style={styles.subtitle}>
          {isLoginState 
            ? "Enter your password to continue logging in."
            : "Make it something memorable — at least 8 characters."}
        </Text>

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#8A8A9A" />
            </TouchableOpacity>
          }
          style={{ marginBottom: Spacing.xs }}
        />

        {isLoginState && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {/* Strength meter always visible so users know it exists */}
        {!isLoginState && (
          <View style={styles.strengthRow}>
            <View style={styles.strengthBarWrapper}>
              {[1, 2, 3].map(l => (
                <View 
                  key={l} 
                  style={[
                    styles.strengthBar, 
                    { backgroundColor: l <= strength && password.length > 0 ? strengthColors[strength] : '#E5E5EA' }
                  ]} 
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: password.length > 0 ? strengthColors[strength] : '#8A8A9A' }]}>
              {password.length > 0 ? strengthLabels[strength] : '8+ chars'}
            </Text>
          </View>
        )}

        {!isLoginState && (
          <View style={{ marginTop: Spacing.lg }}>
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
              rightIcon={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {isMatch && <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />}
                </View>
              }
              error={confirm.length > 0 && !isMatch ? "Passwords don't match" : ''}
            />
          </View>
        )}
      </ScrollView>

      {/* Pill Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity 
          activeOpacity={canContinue && !loading ? 0.85 : 1}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          <LinearGradient
            colors={canContinue && !loading ? ['#FF1E76', '#FF6B35'] : ['#E0E0E0', '#E0E0E0']}
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
  loginHeader: { paddingHorizontal: Spacing.xl, height: 50, justifyContent: 'center' },
  backBtnWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#0D0D26', 
    marginBottom: Spacing.xs, 
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  subtitle: { fontSize: 14, color: '#7B7B8F', lineHeight: 22, marginBottom: Spacing.xl },
  
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs, marginBottom: Spacing.md },
  strengthBarWrapper: { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 5, borderRadius: 2.5 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 45, textAlign: 'right' },
  
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  continueBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  continueBtnDisabled: { elevation: 0, shadowOpacity: 0 },
  continueGradient: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  arrowIcon: { marginTop: 1 },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  forgotText: {
    color: '#E91E8C',
    fontSize: 14,
    fontWeight: '700',
  },
});
