import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity, Alert, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as Google from 'expo-auth-session/providers/google';
import { OAuthProvider, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Shadow, Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import AnimatedLogo from '../../components/brand/AnimatedLogo';
import HeroCarousel from '../../components/carousel/HeroCarousel';
import { Brand } from '../../components/brand/brand';
import i18n from '../../i18n';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { width } = useWindowDimensions();
  const { isPhone } = useBreakpoints();

  const CARDS = [
    { 
      id: 1, 
      photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600', 
      name: 'Sofia, 22', 
      title: 'Artist',
      rotate: '-10deg', 
      left: '5%', 
      top: 25, 
      zIndex: 1, 
      scale: 0.88,
      hasHeart: true
    },
    { 
      id: 2, 
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', 
      name: 'Emma, 23', 
      title: 'Designer',
      rotate: '10deg', 
      right: '5%', 
      top: 25, 
      zIndex: 1, 
      scale: 0.88,
      hasHeart: true
    },
    { 
      id: 3, 
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', 
      name: 'Zara, 24', 
      title: 'Photographer',
      rotate: '0deg', 
      alignSelf: 'center',
      top: 5, 
      zIndex: 2, 
      scale: 1.02,
      isNew: true,
      isVerified: true,
      hasHeart: false
    },
  ];

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || 'mock-ios-client-id',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 'mock-android-client-id',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || 'mock-web-client-id',
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const { id_token } = response.authentication as any;
      const credential = GoogleAuthProvider.credential(id_token);
      setSocialLoading(true);
      signInWithCredential(auth, credential)
        .then(() => {
          // Firebase Auth will update context automatically
        })
        .catch((error) => {
          console.error('[Google Sign-In] Firebase login failed:', error);
          Alert.alert('Sign In Failed', error.message || 'Could not verify Google credentials.');
        })
        .finally(() => {
          setSocialLoading(false);
        });
    }
  }, [response]);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const { url } = event;
      if (!url) return;
      
      const { isSignInWithEmailLink, signInWithEmailLink } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      if (isSignInWithEmailLink(auth, url)) {
        try {
          const savedEmail = await AsyncStorage.getItem('emailForSignIn');
          if (!savedEmail) {
            Alert.alert('Email Required', 'Please enter your email to complete sign in.', [
              {
                text: 'OK',
                onPress: () => navigation.navigate('PhoneEmail')
              }
            ]);
            return;
          }
          await signInWithEmailLink(auth, savedEmail, url);
          await AsyncStorage.removeItem('emailForSignIn');
        } catch (err) {
          console.error('[MagicLink] Sign in error:', err);
          Alert.alert('Link Expired', 'This sign-in link is invalid or has already been used.');
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const [socialLoading, setSocialLoading] = useState(false);

  const handleSocialLogin = async (platform) => {
    if (platform === 'Apple') {
      try {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert(
            'Not Supported',
            'Apple Sign-In is only supported on iOS devices.',
            [{ text: 'OK' }]
          );
          return;
        }

        setSocialLoading(true);
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const { identityToken } = appleCredential;
        if (identityToken) {
          const provider = new OAuthProvider('apple.com');
          const credential = provider.credential({
            idToken: identityToken,
          });
          await signInWithCredential(auth, credential);
        } else {
          throw new Error('No identity token returned from Apple.');
        }
      } catch (err) {
        if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 'ERR_CANCELED') {
          console.log('[Apple Sign-In] User cancelled sign in.');
        } else {
          console.error('[Apple Sign-In] Failed:', err);
          Alert.alert('Sign In Failed', err.message || 'Could not verify Apple credentials.');
        }
      } finally {
        setSocialLoading(false);
      }
    } else {
      Alert.alert(
        `${platform} Login`,
        `Connecting to ${platform} sandbox authentication...`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('PhoneEmail', { isLogin: true }) }
        ]
      );
    }
  };

  const actionContent = (
    <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={styles.getStartedBtn}
        onPress={() => navigation.navigate('PhoneEmail', { isLogin: false })}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Get Started"
      >
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={styles.getStartedGradient}
        >
          <Text style={styles.getStartedText}>GET STARTED</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* OR Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Row */}
      <View style={styles.socialRow}>
        <TouchableOpacity 
          style={styles.socialBtn} 
          disabled={!request || socialLoading}
          onPress={() => promptAsync()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.socialBtnText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn} 
          onPress={() => handleSocialLogin('Apple')}
          disabled={socialLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Apple"
        >
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text style={styles.socialBtnText}>Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn} 
          onPress={() => navigation.navigate('PhoneEmail', { isLogin: false, preferPhone: true })}
          disabled={socialLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Phone"
        >
          <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
          <Text style={styles.socialBtnText}>Phone</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.loginContainer}
        onPress={() => navigation.navigate('PhoneEmail', { isLogin: true })}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="link"
        accessibilityLabel="Already have an account? Sign In"
      >
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#14051A', '#2D1030', '#14051A']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ResponsiveScreen scrollable={isPhone} backgroundColor="transparent">
        {isPhone ? (
          <View style={styles.mobileLayout}>
            {/* Card stack area */}
            <Animated.View style={[styles.cardsArea, { opacity: fadeAnim }]}>
              <HeroCarousel cards={CARDS} autoplay={true} interval={5000} animationDuration={700} />
            </Animated.View>

            {/* Logo Section */}
            <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoWrapper}>
                <AnimatedLogo type="logo" animation="float" size="lg" variant="dark" duration={3500} />
              </View>
              <Text style={styles.wordmark}>Lovly</Text>
              <View style={styles.wordmarkLine} />
              <Text style={styles.subtext}>
                Elevated connections for the modern romantic.
              </Text>
            </Animated.View>

            {actionContent}
          </View>
        ) : (
          <View style={styles.desktopLayout}>
            {/* Left side: Branding */}
            <View style={styles.desktopLeft}>
              <Animated.View style={[styles.cardsAreaDesktop, { opacity: fadeAnim }]}>
                <HeroCarousel cards={CARDS} autoplay={true} interval={5000} animationDuration={700} />
              </Animated.View>
              <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.logoWrapper}>
                  <AnimatedLogo type="logo" animation="float" size="lg" variant="dark" duration={3500} />
                </View>
                <Text style={styles.wordmark}>Lovly</Text>
                <View style={styles.wordmarkLine} />
                <Text style={styles.subtext}>
                  Elevated connections for the modern romantic.
                </Text>
              </Animated.View>
            </View>

            {/* Right side: Login controls */}
            <View style={styles.desktopRight}>
              {actionContent}
            </View>
          </View>
        )}
      </ResponsiveScreen>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14051A' },
  mobileLayout: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
  
  desktopLayout: { 
    flex: 1, 
    flexDirection: 'row', 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  desktopLeft: { 
    flex: 1.2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Spacing.xl,
  },
  desktopRight: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Spacing.xl, 
    maxWidth: 480, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: Radius['2xl'], 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)', 
    paddingVertical: Spacing['2xl'],
  },

  cardsArea: { height: 260, position: 'relative', width: '100%', marginTop: Spacing.md },
  cardsAreaDesktop: { height: 320, position: 'relative', width: '100%', maxWidth: 400 },
  
  logoSection: { alignItems: 'center', width: '100%', marginTop: 20 },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: Radius['2xl'],
    backgroundColor: 'rgba(232, 98, 143, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232, 98, 143, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#E8628F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  wordmark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.serif,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  wordmarkLine: {
    width: 32,
    height: 1.5,
    backgroundColor: '#F1D5A5',
    marginBottom: Spacing.md,
  },
  subtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
    fontFamily: Typography.fontFamily.sansSerif,
  },

  actionSection: { width: '100%', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
  getStartedBtn: { width: '100%', borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.primary },
  getStartedGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  getStartedText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 1.5, fontFamily: Typography.fontFamily.sansSerif },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xs, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { marginHorizontal: Spacing.md, color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, fontWeight: '600' },

  socialRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: Spacing.sm },
  socialBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 48, 
    borderRadius: Radius.lg, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    gap: Spacing.xs,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  socialBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  loginContainer: { paddingVertical: Spacing.sm, ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }) },
  loginText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontFamily: Typography.fontFamily.sansSerif },
  loginLink: { color: '#E8628F', fontWeight: '700' },
});
