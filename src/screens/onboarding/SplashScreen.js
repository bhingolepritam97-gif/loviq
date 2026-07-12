import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Gradients, Spacing } from '../../theme';;

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={Gradients.primary.colors} start={Gradients.primary.start} end={{ x: 1, y: 1 }} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logoIcon}>💜</Text>
        <Text style={styles.logoText}>Loviq</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Find your forever ✨
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  logoIcon: { fontSize: 72, marginBottom: Spacing.sm },
  logoText: { fontSize: 52, fontWeight: '800', color: Colors.white, letterSpacing: -1.5 },
  tagline: { fontSize: Typography.fontSize.lg, color: 'rgba(255,255,255,0.85)', marginTop: Spacing.base, letterSpacing: 0.3 },
});
