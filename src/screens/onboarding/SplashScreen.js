import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Brand, BrandAnimation } from '../../components/brand/brand';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Core animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Logo entrance (spring)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.6,
        duration: 800,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Tagline reveal
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    // Navigate to Welcome after splash duration
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, BrandAnimation.splash);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Soft cream radial glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Logo group */}
      <Animated.View
        style={[
          styles.logoGroup,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Sail mark — large, centered */}
        <View style={styles.sailMark}>
          {/* Mast */}
          <View style={styles.mast} />
          {/* Sail triangle */}
          <View style={styles.sail} />
          {/* Four-point star */}
          <View style={styles.starWrap}>
            <View style={styles.starV} />
            <View style={styles.starH} />
          </View>
        </View>

        {/* "vela" wordmark text */}
        <Text style={styles.wordmark} allowFontScaling={false}>
          vela
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Find your way to someone
      </Animated.Text>
    </View>
  );
}

const MARK_SIZE = 90;
const SCALE = MARK_SIZE / 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Brand.copper,
    opacity: 0,
  },
  logoGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  // --- Sail mark ---
  sailMark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mast: {
    position: 'absolute',
    width: SCALE * 3.5,
    height: MARK_SIZE * 0.7,
    backgroundColor: Brand.navy,
    borderRadius: SCALE * 2,
    bottom: MARK_SIZE * 0.08,
    left: MARK_SIZE / 2 - SCALE * 1.75,
  },
  sail: {
    position: 'absolute',
    bottom: MARK_SIZE * 0.24,
    left: MARK_SIZE / 2,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: SCALE * 16,
    borderBottomWidth: MARK_SIZE * 0.48,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Brand.copper,
  },
  starWrap: {
    position: 'absolute',
    bottom: MARK_SIZE * 0.01,
    right: SCALE * 4,
    width: SCALE * 12,
    height: SCALE * 12,
  },
  starV: {
    position: 'absolute',
    width: SCALE * 2.5,
    height: SCALE * 12,
    backgroundColor: Brand.navy,
    borderRadius: SCALE,
    left: SCALE * 4.75,
    top: 0,
  },
  starH: {
    position: 'absolute',
    width: SCALE * 12,
    height: SCALE * 2.5,
    backgroundColor: Brand.navy,
    borderRadius: SCALE,
    top: SCALE * 4.75,
    left: 0,
  },

  // --- Wordmark ---
  wordmark: {
    fontSize: 52,
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    color: Brand.navy,
    letterSpacing: -1,
    includeFontPadding: false,
    marginTop: 4,
  },

  // --- Tagline ---
  tagline: {
    position: 'absolute',
    bottom: height * 0.12,
    fontSize: 13,
    fontWeight: '500',
    color: Brand.navy,
    opacity: 0.45,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
