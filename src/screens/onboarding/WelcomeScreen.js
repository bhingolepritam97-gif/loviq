import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Colors, Shadow, Typography, Spacing, Radius } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const CARDS = [
  { 
    id: 1, 
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600', 
    name: 'Sofia, 22', 
    title: 'Artist',
    rotate: '-10deg', 
    left: width * 0.05, 
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
    right: width * 0.05, 
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
    isVerified: true
  },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || 'mock-ios-client-id',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 'mock-android-client-id',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || 'mock-web-client-id',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          // Firebase Auth will update context automatically
        })
        .catch((error) => {
          console.error('[Google Sign-In] Firebase login failed:', error);
          Alert.alert('Sign In Failed', error.message || 'Could not verify Google credentials.');
        });
    }
  }, [response]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 100, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const [socialLoading, setSocialLoading] = useState(false);

  const handleSocialLogin = async (platform) => {
    if (platform === 'Apple') {
      setSocialLoading(true);
      try {
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
        const mockEmail = 'apple-test-user@loviq.com';
        const mockPassword = 'AppleMockPassword123';
        try {
          await signInWithEmailAndPassword(auth, mockEmail, mockPassword);
        } catch (signInErr) {
          // If user doesn't exist, sign up the mock profile
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
            } catch (signUpErr) {
              // If already created but threw other auth mismatch, fallback to sign in
              await signInWithEmailAndPassword(auth, mockEmail, mockPassword);
            }
          } else {
            throw signInErr;
          }
        }
      } catch (err) {
        console.warn('[Apple Mock Auth] failed, routing to Phone/Email:', err.message);
        navigation.navigate('PhoneEmail', { isLogin: true });
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF8F8', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.lg }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Card stack area */}
        <Animated.View style={[styles.cardsArea, { transform: [{ translateY: floatY }] }]}>
          {CARDS.map((card) => {
            const cardStyle = card.alignSelf 
              ? { alignSelf: 'center', top: card.top, zIndex: card.zIndex }
              : { top: card.top, left: card.left, right: card.right, zIndex: card.zIndex };
              
            return (
              <Animated.View
                key={card.id}
                style={[
                  styles.floatingCard, 
                  cardStyle,
                  { 
                    transform: [
                      { rotate: card.rotate },
                      { scale: card.scale }
                    ], 
                    opacity: fadeAnim 
                  }
                ]}
              >
                <Image source={{ uri: card.photo }} style={styles.cardImage} />
                
                {card.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>✨ New here</Text>
                  </View>
                )}

                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cardScrim}>
                  <View style={styles.cardInfoRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {card.name}
                    </Text>
                    {card.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#FF3A5C" style={styles.verifiedIcon} />
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </LinearGradient>

                {card.hasHeart && (
                  <View style={[styles.cardHeartCircle, card.left ? { left: -10 } : { right: -10 }]}>
                    <Ionicons name="heart" size={14} color="#FF3A5C" />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Dots indicator */}
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Logo Section */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim }]}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Heading Section */}
        <Animated.View style={[styles.contentSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headline}>
            Find someone{'\n'}who <Text style={styles.headlineAccent}>gets</Text> you
          </Text>
          
          <Text style={styles.subtext}>
            Real connections, real people. {'\n'}Your perfect match is <Text style={styles.subtextAccent}>closer</Text> than you think.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              activeOpacity={0.85} 
              style={styles.getStartedBtn}
              onPress={() => navigation.navigate('PhoneEmail', { isLogin: false })}
            >
              <LinearGradient
                colors={['#FF1E76', '#FF6B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getStartedGradient}
              >
                <Text style={styles.getStartedText}>Get started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
              </LinearGradient>
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={styles.socialBtn} 
                disabled={!request}
                onPress={() => promptAsync()}
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')}>
                <Ionicons name="logo-apple" size={18} color="#000000" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialBtn} 
                onPress={() => navigation.navigate('PhoneEmail', { isLogin: false, preferPhone: true })}
              >
                <Ionicons name="phone-portrait-outline" size={18} color="#1A1A2E" />
                <Text style={styles.socialBtnText}>Phone</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <TouchableOpacity 
              style={styles.loginContainer}
              onPress={() => navigation.navigate('PhoneEmail', { isLogin: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  
  // Card stack styles
  cardsArea: { height: 250, position: 'relative', width: '100%', marginTop: Spacing.md },
  floatingCard: {
    position: 'absolute',
    width: width * 0.40,
    height: 195,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, height: '60%', justifyContent: 'flex-end' },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  cardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
  verifiedIcon: { marginTop: 1 },
  newBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.sm },
  newBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  cardHeartCircle: { position: 'absolute', top: '45%', width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', ...Shadow.sm, zIndex: 10 },

  // Pagination indicator
  pagination: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginVertical: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: '#FF3A5C', width: 14 },

  // Logo styles
  logoSection: { alignItems: 'center', marginVertical: Spacing.xs },
  logoImage: { width: 100, height: 50 },

  // Content styles
  contentSection: { alignItems: 'center', width: '100%' },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D0D26',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headlineAccent: { color: '#FF3A5C', textDecorationLine: 'underline' },
  subtext: {
    fontSize: 14,
    color: '#7B7B8F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  subtextAccent: { color: '#FF1E76', fontWeight: '700' },

  // Action Buttons
  buttonGroup: { width: '100%', gap: Spacing.md, alignItems: 'center' },
  getStartedBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  getStartedGradient: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  getStartedText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  arrowIcon: { marginLeft: Spacing.xs },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: Spacing.xs, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0F0F5' },
  dividerText: { color: '#BDBDCF', fontSize: 11, fontWeight: '700' },

  // Social Row
  socialRow: { flexDirection: 'row', width: '100%', gap: Spacing.sm, justifyContent: 'space-between' },
  socialBtn: { flex: 1, flexDirection: 'row', height: 44, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF' },
  socialBtnText: { fontSize: 13, color: '#1A1A2E', fontWeight: '600' },

  // Footer
  loginContainer: { paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  loginText: { fontSize: 13, color: '#8A8A9A' },
  loginLink: { color: '#FF3A5C', fontWeight: '700' },
});
