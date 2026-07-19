import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Shadow, Typography, Spacing, Radius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import BrandIcon from '../../components/brand/BrandIcon';
import { Brand } from '../../components/brand/brand';

export default function PasswordScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const { email, isLogin } = route.params || {};
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
        // AuthContext automatically catches the state update and routes to Main
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Route to profile details onboarding
        navigation.navigate('BasicInfo', {
          email,
          uid: userCredential.user.uid,
          isLogin: false,
        });
      }
    } catch (err) {
      console.warn('[FirebaseAuth Error]', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password or invalid credentials. If you are registering, this email may already be in use.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError('Authentication failed. Please verify your credentials or check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      console.warn('[FirebaseAuth Error]', err.code, err.message);
      setError('Failed to send password reset email. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[Colors.background, Colors.background]} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.lg }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <BrandIcon size="sm" variant="dark" />
        </View>
 
        <Text style={styles.title}>{isLogin ? 'Enter your password' : 'Choose a password'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? `Logging in as ${email}` : `Create a password for ${email}`}
        </Text>
 
        <View style={styles.inputContainer}>
          <Input
            placeholder="Password"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setError('');
            }}
            secureTextEntry={secureTextEntry}
            autoFocus
            rightIcon={
              <TouchableOpacity 
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
              >
                <Ionicons name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            }
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {isLogin && (
            <TouchableOpacity 
              onPress={handleForgotPassword} 
              style={styles.forgotPasswordContainer}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password? Send reset link"
            >
              <Text style={styles.forgotPasswordText}>
                {resetSent ? 'Reset link sent to your email!' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => {
              navigation.navigate('OTP', {
                email,
                isLogin,
                isEmailLink: true,
              });
            }} 
            style={styles.forgotPasswordContainer}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Email me a Magic Link instead"
          >
            <Text style={styles.forgotPasswordText}>
              Email me a Magic Link instead
            </Text>
          </TouchableOpacity>
        </View>
 
        <TouchableOpacity 
          style={[styles.continueButton, password.length < 6 && styles.continueButtonDisabled]}
          disabled={password.length < 6 || loading}
          onPress={handleContinue}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isLogin ? "Log In" : "Continue"}
        >
          <LinearGradient
            colors={password.length < 6 ? [Colors.border, Colors.border] : Colors.gradientColors}
            start={Colors.gradientAngle.start}
            end={Colors.gradientAngle.end}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>{isLogin ? 'Log In' : 'Continue'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
 
const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 24, lineHeight: 22 },
  inputContainer: { width: '100%', marginBottom: 24 },
  errorText: { color: Colors.error, fontSize: 13, marginTop: 8, fontWeight: '600' },
  continueButton: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: 'auto' },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  forgotPasswordContainer: { marginTop: 12, alignSelf: 'flex-start' },
  forgotPasswordText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
