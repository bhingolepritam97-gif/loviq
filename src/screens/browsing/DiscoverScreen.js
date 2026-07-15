import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, PanResponder, Animated, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToPotentialMatches, recordSwipe, notifyDeckSwipe } from '../../services/DiscoverService';
import { useDeferredOnboardingPrompts } from '../../hooks/useDeferredOnboardingPrompts';
import { useLocationCapture } from '../../hooks/useLocationCapture';
import { getGracePeriodStatus } from '../../utils/gracePeriod';
import VerifiedBadge from '../../components/VerifiedBadge';
import EmptyStateScreen from './EmptyStateScreen';
import BrandHeader from '../../components/brand/BrandHeader';
import { Brand } from '../../components/brand/brand';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.28 * width;

export default function DiscoverScreen({ navigation, route }) {
  const [profiles, setProfiles] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSwipedProfile, setLastSwipedProfile] = useState(null);
  const rewindTimeout = useRef(null);
  const insets = useSafeAreaInsets();
  const position = useRef(new Animated.ValueXY()).current;
  const { user, profile, setProfile } = useAuth();

  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Location capture — hook replaces the inline 'auto-heal' block below
  const { captureLocation } = useLocationCapture({
    user,
    profile,
    onLocationSaved: (updatedProfile) => {
      setProfile(updatedProfile);
      setRefreshTrigger((prev) => prev + 1);
    },
  });

  // Track daily likes (simplified for client-side demo)
  const [likesCount, setLikesCount] = useState(0);
  const FREE_DAILY_LIKES = 10;

  const [swipeCount, setSwipeCount] = useState(0);
  const [inGracePeriod, setInGracePeriod] = useState(false);

  // Check if this user is still in their free 24h window
  useEffect(() => {
    getGracePeriodStatus().then(setInGracePeriod);
  }, []);

  useDeferredOnboardingPrompts({
    swipeCount,
    hasMatched: false,
    signupTimestamp: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
    hasPassword: false, 
  });

  const setupSubscription = useCallback(() => {
    // If we have custom profiles passed in from EmptyStateScreen, use them directly
    if (route?.params?.profiles && route.params.profiles.length > 0) {
      setProfiles(route.params.profiles);
      setLoading(false);
      setError(null);
      // Clear route params so it doesn't trigger again on subsequent focuses
      navigation.setParams({ profiles: undefined });
      return () => {};
    }

    if (user && profile) {
      // Trigger location capture if the profile is missing coordinates and do not query yet.
      if (!profile.location?.latitude) {
        setLoading(true);
        captureLocation();
        return () => {};
      }

      setLoading(true);
      setError(null);

      const unsubscribe = subscribeToPotentialMatches(user.uid, profile, (potential) => {
        setProfiles(potential);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      setLoading(false);
      return () => {};
    }
  }, [user, profile, refreshTrigger, route?.params?.profiles, captureLocation]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = setupSubscription();
      setActivePhotoIndex(0);
      return () => unsubscribe();
    }, [setupSubscription])
  );

  // Interpolation for active card rotate
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Interpolation for stamps opacity
  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superLikeOpacity = position.y.interpolate({
    inputRange: [-height / 6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Background Card 1 (Index 1) interpolations
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  const nextCardTranslateY = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0, 8, 0],
    extrapolate: 'clamp',
  });

  const nextCardRotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['0deg', '3deg', '0deg'],
    extrapolate: 'clamp',
  });

  // Background Card 2 (Index 2) interpolations
  const thirdCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0.95, 0.90, 0.95],
    extrapolate: 'clamp',
  });

  const thirdCardTranslateY = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [8, 16, 8],
    extrapolate: 'clamp',
  });

  const thirdCardRotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['3deg', '-2deg', '3deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger swipe drag if gesture moved significantly (tap vs swipe distinction)
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          forceSwipe('up');
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction) => {
    if (profiles.length === 0) return;
    
    // Paywall Intercept for Likes — bypassed during 24h grace period
    if (direction === 'right' && !profile?.isPremium && !inGracePeriod && likesCount >= FREE_DAILY_LIKES) {
      navigation.navigate('Profile', { screen: 'Premium' });
      resetPosition();
      return;
    }

    // Paywall Intercept for Super Likes
    if (direction === 'up') {
      const superLikesLeft = profile?.superLikesCount ?? (profile?.isPremium ? 5 : 1);
      if (superLikesLeft <= 0) {
        navigation.navigate('SuperLike');
        resetPosition();
        return;
      }
    }

    const x = direction === 'right' ? width + 120 : direction === 'left' ? -width - 120 : 0;
    const y = direction === 'up' ? -height - 120 : 0;
    Animated.timing(position, {
      toValue: { x, y },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = async (direction) => {
    setSwipeCount(prev => prev + 1);
    const swipedProfile = profiles[0];
    setProfiles(prev => prev.slice(1));
    setActivePhotoIndex(0);
    position.setValue({ x: 0, y: 0 });

    // Notify the deck cache that a card was consumed — triggers background
    // refetch if remaining cards fall at or below the low-deck threshold.
    notifyDeckSwipe();

    if (direction === 'left') {
      setLastSwipedProfile(swipedProfile);
      if (rewindTimeout.current) clearTimeout(rewindTimeout.current);
      rewindTimeout.current = setTimeout(() => {
        setLastSwipedProfile(null);
      }, 5000);
    } else {
      setLastSwipedProfile(null);
      // Increment likes counter
      if (direction === 'right' || direction === 'up') {
        setLikesCount(prev => prev + 1);
      }
    }

    if (user && swipedProfile) {
      try {
        const matchResult = await recordSwipe(user.uid, swipedProfile.id, direction, swipedProfile);
        if (matchResult) {
          // It's a match!
          navigation.navigate('Match', { 
            matchProfile: matchResult.matchedUser,
            matchId: matchResult.id 
          });
        }
      } catch (err) {
        console.error('Error recording swipe:', err);
      }
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
  };

  const handleRewind = () => {
    if (!profile?.isPremium) {
      navigation.navigate('Rewind');
      return;
    }

    if (lastSwipedProfile) {
      setProfiles(prev => [lastSwipedProfile, ...prev]);
      setLastSwipedProfile(null);
      if (rewindTimeout.current) clearTimeout(rewindTimeout.current);
    }
  };

  const renderCardStack = () => {
    if (loading) {
      return (
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.scrim}>
            <View style={styles.infoArea}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonText} />
              <View style={styles.skeletonTextShort} />
              <View style={styles.interestsRow}>
                <View style={styles.skeletonChip} />
                <View style={styles.skeletonChip} />
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setRefreshTrigger(prev => prev + 1)}
          >
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (profiles.length === 0) {
      return (
        <EmptyStateScreen
          navigation={navigation}
          inline={true}
          route={{
            params: {
              currentRadius: profile?.distance_range ?? profile?.searchRadius ?? 25,
              userLocation: profile?.location ?? null,
            }
          }}
        />
      );
    }

    return profiles.map((profile, i) => {
      // Limit rendered cards in stack to max 3 for performance
      if (i > 2) return null;

      if (i === 0) {
        return (
          <Animated.View
            key={profile.id}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: rotate },
                ],
                zIndex: 10,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Carousel Images */}
            <Image source={{ uri: profile.photos[activePhotoIndex] || profile.photos[0] }} style={styles.image} />
            
            {/* Top Carousel Indicators */}
            {profile.photos.length > 1 && (
              <View style={styles.carouselIndicators}>
                {profile.photos.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.indicatorSegment,
                      { opacity: idx === activePhotoIndex ? 1.0 : 0.4 },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Left/Right tap areas to trigger carousel navigation */}
            <View style={styles.tapNavigationOverlay}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.tapAreaHalf}
                onPress={() => {
                  if (activePhotoIndex > 0) {
                    setActivePhotoIndex(activePhotoIndex - 1);
                  }
                }}
              />
              <TouchableOpacity
                activeOpacity={1}
                style={styles.tapAreaHalf}
                onPress={() => {
                  if (activePhotoIndex < profile.photos.length - 1) {
                    setActivePhotoIndex(activePhotoIndex + 1);
                  }
                }}
              />
            </View>
            
            {/* Stamp Overlays */}
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeText}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.superLikeStamp, { opacity: superLikeOpacity }]}>
              <Text style={styles.superLikeText}>SUPER LIKE</Text>
            </Animated.View>

                {/* Profile Info overlay */}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.scrim}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProfileDetail', { profile })}
                style={styles.infoArea}
              >
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                  {/* VerifiedBadge replaces the old plain ✓ text character.
                      Unverified gets a ghost badge so the contrast is obvious. */}
                  <VerifiedBadge
                    isVerified={!!profile.isVerified}
                    size="sm"
                    showLabel={false}
                    style={{ marginLeft: 6, marginTop: 2 }}
                  />
                </View>
                <Text style={styles.jobText}>{profile.job || 'Explorer'}</Text>
                <Text style={styles.distanceText}>📍 {profile.cityName ? `${profile.cityName} · ` : ''}{profile.distance ? `${parseFloat(profile.distance).toFixed(1)} miles away` : 'Nearby'}</Text>
                <Text style={styles.bioText} numberOfLines={2}>{profile.bio}</Text>

                {/* Interest chips */}
                {profile.interests && profile.interests.length > 0 && (
                  <View style={styles.interestsRow}>
                    {profile.interests.slice(0, 3).map((interest, idx) => (
                      <View key={idx} style={styles.interestChip}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        );
      }

      // Background Card 1 (Index 1)
      if (i === 1) {
        return (
          <Animated.View
            key={profile.id}
            style={[
              styles.card,
              {
                transform: [
                  { translateY: nextCardTranslateY },
                  { scale: nextCardScale },
                  { rotate: nextCardRotate },
                ],
                zIndex: 5,
              },
            ]}
          >
            <Image source={{ uri: profile.photos[0] }} style={styles.image} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.scrim}>
              <View style={styles.infoArea}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                </View>
                <Text style={styles.jobText}>{profile.job || 'Explorer'}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        );
      }

      // Background Card 2 (Index 2)
      if (i === 2) {
        return (
          <Animated.View
            key={profile.id}
            style={[
              styles.card,
              {
                transform: [
                  { translateY: thirdCardTranslateY },
                  { scale: thirdCardScale },
                  { rotate: thirdCardRotate },
                ],
                zIndex: 2,
              },
            ]}
          >
            <Image source={{ uri: profile.photos[0] }} style={styles.image} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.scrim}>
              <View style={styles.infoArea}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                </View>
                <Text style={styles.jobText}>{profile.job || 'Explorer'}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        );
      }

      return null;
    }).reverse();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <BrandHeader 
        rightIcon="options-outline" 
        onRightPress={() => navigation.navigate('Filters')} 
      />

      {/* Main Stack */}
      <View style={styles.stackArea}>
        {renderCardStack()}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow} accessible={false}>
        <TouchableOpacity 
          style={[styles.circleButton, styles.rewind, !lastSwipedProfile && { opacity: 0.5 }]} 
          onPress={handleRewind}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Rewind last swipe"
          disabled={!lastSwipedProfile}
        >
          <Text style={styles.btnEmoji}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.circleButton, styles.nope, profiles.length === 0 && { opacity: 0.5 }]} 
          onPress={() => forceSwipe('left')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Pass on this profile"
          disabled={profiles.length === 0}
        >
          <Text style={styles.btnEmoji}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.circleButton, styles.superLike, profiles.length === 0 && { opacity: 0.5 }]} 
          onPress={() => forceSwipe('up')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Super like this profile"
          disabled={profiles.length === 0}
        >
          <Text style={styles.btnEmoji}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.circleButton, styles.like, profiles.length === 0 && { opacity: 0.5 }]} 
          onPress={() => forceSwipe('right')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Like this profile"
          disabled={profiles.length === 0}
        >
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.likeBtnGradient}
          >
            <Text style={styles.btnEmojiLike}>❤️</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.circleButton, styles.boost]} 
          onPress={() => navigation.navigate('Premium')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Boost your profile"
        >
          <Text style={styles.btnEmoji}>⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'space-between' },
  stackArea: { flex: 1, marginHorizontal: Spacing.md, marginVertical: Spacing.sm, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  card: { width: '100%', height: '100%', borderRadius: Radius.lg, overflow: 'hidden', position: 'absolute', backgroundColor: Colors.surfaceElevated, ...Shadow.md },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  scrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '48%', justifyContent: 'flex-end', padding: Spacing.xl },
  infoArea: { width: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  verified: { fontSize: 16, color: Colors.success, fontWeight: 'bold' },
  jobText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontWeight: '500' },
  distanceText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs, fontWeight: '500' },
  bioText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: Spacing.md, lineHeight: 20 },
  
  carouselIndicators: { position: 'absolute', top: 12, left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', gap: Spacing.xs, zIndex: 20 },
  indicatorSegment: { flex: 1, height: 3, backgroundColor: Colors.white, borderRadius: 2 },
  tapNavigationOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 15, height: '70%' },
  tapAreaHalf: { flex: 1 },

  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.md },
  interestChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  interestText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  stamp: { position: 'absolute', top: 48, borderWidth: 4, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.15)' },
  likeStamp: { left: 40, borderColor: '#C6602E', transform: [{ rotate: '-10deg' }] },
  nopeStamp: { right: 40, borderColor: Colors.error, transform: [{ rotate: '10deg' }] },
  superLikeStamp: { alignSelf: 'center', bottom: 120, top: 'auto', borderColor: '#3b82f6', transform: [{ rotate: '-5deg' }], backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  likeText: { fontSize: 32, fontWeight: '900', color: '#C6602E', letterSpacing: 2 },
  nopeText: { fontSize: 32, fontWeight: '900', color: Colors.error, letterSpacing: 2 },
  superLikeText: { fontSize: 26, fontWeight: '900', color: '#3b82f6', letterSpacing: 1 },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md },
  circleButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
  rewind: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#12202E' },
  nope: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.5, borderColor: '#12202E' },
  superLike: { width: 48, height: 48, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: '#12202E' },
  like: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 8 },
  likeBtnGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  boost: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#12202E' },
  btnEmoji: { fontSize: 22 },
  btnEmojiLike: { fontSize: 26 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 72, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  retryButton: { width: 160, borderRadius: Radius.full, overflow: 'hidden' },
  retryButtonGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  retryButtonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  
  skeletonCard: { width: '100%', height: '100%', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.border, position: 'absolute' },
  skeletonImage: { width: '100%', height: '100%', backgroundColor: Colors.border },
  skeletonTitle: { width: '60%', height: 32, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.sm },
  skeletonText: { width: '80%', height: 16, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.xs },
  skeletonTextShort: { width: '40%', height: 16, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.md },
  skeletonChip: { width: 80, height: 28, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
});
