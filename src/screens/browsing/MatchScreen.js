import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients, Shadow } from '../../theme';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function MatchScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { matchProfile, matchId } = route.params || {};
  const { profile } = useAuth();

  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const leftCardPos = useRef(new Animated.Value(-width)).current;
  const rightCardPos = useRef(new Animated.Value(width)).current;

  // Floating animations for left and right avatars
  const floatLeft = useRef(new Animated.Value(0)).current;
  const floatRight = useRef(new Animated.Value(0)).current;

  // Heart badge pulse animation
  const pulse = useRef(new Animated.Value(1)).current;

  // Drifting hearts particles animation values - initialized once inside a single useRef to avoid Hook rule violation
  const heartsRef = useRef(
    Array.from({ length: 12 }).map((_, i) => ({
      y: new Animated.Value(0),
      x: 30 + Math.random() * (width - 80),
      xOffset: new Animated.Value(0),
      opacity: new Animated.Value(0),
      delay: i * 350,
      scale: 0.4 + Math.random() * 0.8,
      emoji: ['💖', '💝', '💕', '❤️', '💜', '✨', '🌸'][i % 7],
    }))
  );
  const hearts = heartsRef.current;

  useEffect(() => {
    // Initial entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(leftCardPos, { toValue: 0, bounciness: 8, useNativeDriver: true }),
        Animated.spring(rightCardPos, { toValue: 0, bounciness: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Loop infinite float left avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatLeft, { toValue: -6, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatLeft, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Loop infinite float right avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatRight, { toValue: 6, duration: 2300, useNativeDriver: true }),
        Animated.timing(floatRight, { toValue: 0, duration: 2300, useNativeDriver: true }),
      ])
    ).start();

    // Loop heart pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Start drifting hearts particles
    hearts.forEach((heart) => {
      const animateHeart = () => {
        heart.y.setValue(0);
        heart.opacity.setValue(0);
        heart.xOffset.setValue(0);
        
        Animated.sequence([
          Animated.delay(heart.delay),
          Animated.parallel([
            Animated.timing(heart.opacity, { toValue: 0.85, duration: 400, useNativeDriver: true }),
            Animated.timing(heart.y, { toValue: -320 - Math.random() * 120, duration: 3200, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(heart.xOffset, { toValue: 1, duration: 1600, useNativeDriver: true }),
              Animated.timing(heart.xOffset, { toValue: -1, duration: 1600, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(heart.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(() => {
          animateHeart();
        });
      };
      animateHeart();
    });
  }, []);

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Background glow element */}
      <View style={styles.glowRadial} pointerEvents="none" />

      {/* Drifting Hearts Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {hearts.map((heart, idx) => {
          const translateX = heart.xOffset.interpolate({
            inputRange: [-1, 1],
            outputRange: [-35, 35],
          });
          return (
            <Animated.Text
              key={idx}
              style={[
                styles.floatingHeart,
                {
                  left: heart.x,
                  transform: [
                    { translateY: heart.y },
                    { translateX },
                    { scale: heart.scale },
                  ],
                  opacity: heart.opacity,
                },
              ]}
            >
              {heart.emoji}
            </Animated.Text>
          );
        })}
      </View>

      <Animated.View style={[styles.content, { opacity, paddingTop: insets.top }]}>
        {/* Celebration Title */}
        <Animated.View style={[styles.headerSection, { transform: [{ scale }] }]}>
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>You and {matchProfile?.name || 'someone'} have liked each other.</Text>
        </Animated.View>

        {/* Overlapping Floating Avatars */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatarWrap,
              styles.leftAvatar,
              {
                transform: [
                  { translateX: leftCardPos },
                  { translateY: floatLeft },
                  { rotate: '-6deg' },
                ],
              },
            ]}
          >
            <Image source={{ uri: profile?.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.avatarWrap,
              styles.rightAvatar,
              {
                transform: [
                  { translateX: rightCardPos },
                  { translateY: floatRight },
                  { rotate: '6deg' },
                ],
              },
            ]}
          >
            <Image source={{ uri: matchProfile?.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </Animated.View>

          {/* Central Pulsing Heart Badge */}
          <Animated.View style={[styles.heartBadge, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.heartBadgeText}>❤️</Text>
          </Animated.View>
        </View>

        {/* Buttons Action Area */}
        <View style={styles.actionBlock}>
          <Button 
            label="Send a Message" 
            onPress={() => {
              navigation.navigate('Chat', { matchId: matchId, profile: matchProfile });
            }}
          />
          <TouchableOpacity 
            style={styles.keepSwipingBtn}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.8}
          >
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(18, 10, 10, 0.93)' },
  content: { flex: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  glowRadial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(233, 30, 140, 0.08)',
    borderRadius: width,
    transform: [{ scale: 1.5 }],
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 240,
    fontSize: 20,
  },
  headerSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -1.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
    maxWidth: 240,
  },
  avatarContainer: {
    flexDirection: 'row',
    position: 'relative',
    width: width * 0.8,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  avatarWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.lg,
    backgroundColor: Colors.border,
  },
  leftAvatar: {
    transform: [{ rotate: '-6deg' }],
    marginRight: -15,
  },
  rightAvatar: {
    transform: [{ rotate: '6deg' }],
    marginLeft: -15,
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBadge: {
    position: 'absolute',
    bottom: 12,
    zIndex: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadow.md,
  },
  heartBadgeText: { fontSize: 18, color: Colors.white },
  actionBlock: { width: '100%', gap: Spacing.md, alignItems: 'center' },
  keepSwipingBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepSwipingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
