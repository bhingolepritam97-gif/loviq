import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Typography } from '../../theme';
import { BrandAnimation } from '../../components/brand/brand';

export default function SplashScreen({ navigation }) {
  // Core animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

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
    ]).start();

    // Navigate to Welcome after splash duration
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, BrandAnimation.splash);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
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
        {/* New Lovly Logo */}
        <Image 
          source={require('../../../assets/logo.png')}
          style={styles.logoImage}
        />

        {/* "Lovly" wordmark text */}
        <Text style={styles.wordmark} allowFontScaling={false}>
          Lovly
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  wordmark: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.serif,
    color: '#14051A',
    letterSpacing: -0.5,
    includeFontPadding: false,
    marginTop: 20,
  },
});
