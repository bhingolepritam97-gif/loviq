import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Shadow, Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import BrandIcon from '../../components/brand/BrandIcon';
import { Brand } from '../../components/brand/brand';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

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
  const { isPhone } = useBreakpoints();

  const handleContinue = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.background]} style={StyleSheet.absoluteFill} />
      
      <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <BrandIcon size="sm" variant="dark" />
        </View>

        {/* Inner Form with Desktop support */}
        <View style={styles.innerForm}>
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
                  activeOpacity={0.7}
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
                activeOpacity={0.7}
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
              activeOpacity={0.7}
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
            activeOpacity={password.length < 6 ? 1 : 0.85}
          >
            <LinearGradient
              colors={password.length < 6 ? [Colors.border, Colors.border] : Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.continueButtonText}>{isLogin ? 'Log In' : 'Continue'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ResponsiveScreen>
    </View>
  );
}
 
const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  
  innerForm: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: Spacing.xl,
  },

  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 24, lineHeight: 22 },
  inputContainer: { width: '100%', marginBottom: 24 },
  errorText: { color: Colors.error, fontSize: 13, marginTop: 8, fontWeight: '600' },
  continueButton: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: Spacing.xl, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0, ...Platform.select({ web: { cursor: 'default' } as any, default: {} }) },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  forgotPasswordContainer: { marginTop: 12, alignSelf: 'flex-start', ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  forgotPasswordText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
