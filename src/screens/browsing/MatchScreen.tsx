import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Gradients, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MatchScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { matchProfile, matchId } = route.params || {};
  const { profile } = useAuth();

  const isMixedGender = (profile?.gender === 'Woman' && matchProfile?.gender === 'Man') ||
                        (profile?.gender === 'Man' && matchProfile?.gender === 'Woman');
  const isManInMixedMatch = isMixedGender && profile?.gender === 'Man';

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
    let active = true;

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
    const animLeft = Animated.loop(
      Animated.sequence([
        Animated.timing(floatLeft, { toValue: -6, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatLeft, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    animLeft.start();

    // Loop infinite float right avatar
    const animRight = Animated.loop(
      Animated.sequence([
        Animated.timing(floatRight, { toValue: 6, duration: 2300, useNativeDriver: true }),
        Animated.timing(floatRight, { toValue: 0, duration: 2300, useNativeDriver: true }),
      ])
    );
    animRight.start();

    // Loop heart pulse
    const animPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    animPulse.start();

    // Start drifting hearts particles
    const particleAnimations = [];
    hearts.forEach((heart) => {
      const animateHeart = () => {
        if (!active) return;
        heart.y.setValue(0);
        heart.opacity.setValue(0);
        heart.xOffset.setValue(0);
        
        const seq = Animated.sequence([
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
        ]);
        
        particleAnimations.push(seq);
        seq.start(() => {
          if (active) animateHeart();
        });
      };
      animateHeart();
    });

    return () => {
      active = false;
      animLeft.stop();
      animRight.stop();
      animPulse.stop();
      particleAnimations.forEach(a => a.stop());
    };
  }, []);

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient 
        colors={['#14051A', '#2D1030', '#14051A']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

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

      <Animated.View style={[styles.content, { opacity, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Brand Wordmark at top */}
        <Text style={styles.brandWordmark}>Lovly</Text>

        {/* Overlapping/Interlocking Floating Avatars */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatarWrapLeft,
              {
                transform: [
                  { translateX: leftCardPos },
                  { translateY: floatLeft },
                ],
              },
            ]}
          >
            <Image source={{ uri: profile?.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.avatarWrapRight,
              {
                transform: [
                  { translateX: rightCardPos },
                  { translateY: floatRight },
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

        {/* Celebration Title */}
        <Animated.View style={[styles.headerSection, { transform: [{ scale }] }]}>
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            {isManInMixedMatch 
              ? `You and ${matchProfile?.name || 'Elena'} have both expressed interest in one another.`
              : `Chemistry in bloom.`
            }
          </Text>
        </Animated.View>

        {isManInMixedMatch && (
          <View style={styles.waitingBadgeContainer}>
            <View style={styles.waitingBadge}>
              <View style={styles.waitingDot} />
              <Text style={styles.waitingBadgeText}>WAITING FOR HER TO SAY HELLO</Text>
            </View>
            <Text style={styles.waitingDescription}>
              On Lovly, women start the conversation to ensure a mindful and respectful experience.
            </Text>
          </View>
        )}

        {/* Buttons Action Area */}
        <View style={styles.actionBlock}>
          {isManInMixedMatch ? (
            <View style={[styles.messageBtn, styles.messageBtnDisabled]}>
              <View style={styles.messageGradientDisabled}>
                <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
                <Text style={styles.messageBtnTextDisabled}>SAY HELLO</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.85}
              style={styles.messageBtn}
              onPress={() => {
                navigation.navigate('Chat', { 
                  matchId: matchId, 
                  profile: matchProfile,
                  restrictedMode: isMixedGender,
                  onlyUserIdCanMessageFirst: isMixedGender ? matchProfile?.id : null,
                  firstMessageSent: false
                });
              }}
            >
              <LinearGradient
                colors={Gradients.primary.colors}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.messageGradient}
              >
                <Text style={styles.messageBtnText}>SAY HELLO</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Keep Swiping"
            style={styles.keepSwipingBtn}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.8}
          >
            <Text style={styles.keepSwipingText}>KEEP DISCOVERING</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14051A' },
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  brandWordmark: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.serif,
    letterSpacing: -0.5,
    marginTop: 20,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 240,
    fontSize: 20,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Typography.fontFamily.serif,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
    maxWidth: 260,
    fontFamily: Typography.fontFamily.sansSerif,
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
  // Interlocking circles styling
  avatarWrapLeft: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#1E0B26',
    position: 'absolute',
    left: width * 0.15,
    zIndex: 10,
    ...Shadow.lg,
  },
  avatarWrapRight: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#E8628F',
    overflow: 'hidden',
    backgroundColor: '#1E0B26',
    position: 'absolute',
    right: width * 0.1,
    zIndex: 20,
    shadowColor: '#E8628F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBadge: {
    position: 'absolute',
    bottom: 24,
    left: width * 0.35,
    zIndex: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8628F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
  heartBadgeText: { fontSize: 18, color: '#FFFFFF' },
  actionBlock: { width: '100%', gap: Spacing.md, alignItems: 'center', marginBottom: 20 },
  messageBtn: {
    width: '100%',
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadow.primary,
  },
  messageGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  keepSwipingBtn: {
    width: '100%',
    height: 56,
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepSwipingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  waitingBadgeContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Shadow.sm,
  },
  waitingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8628F',
    marginRight: 8,
  },
  waitingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  waitingDescription: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
    maxWidth: 280,
    fontFamily: Typography.fontFamily.sansSerif,
    fontStyle: 'italic',
  },
  messageBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  messageGradientDisabled: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Typography.fontFamily.sansSerif,
  },
});
