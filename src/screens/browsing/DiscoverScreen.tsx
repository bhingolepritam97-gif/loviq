import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToPotentialMatches,
  recordSwipe,
  notifyDeckSwipe,
  rewindLastSwipe,
} from '../../services/DiscoverService';
import { useDeferredOnboardingPrompts } from '../../hooks/useDeferredOnboardingPrompts';
import { useLocationCapture } from '../../hooks/useLocationCapture';
import { getGracePeriodStatus } from '../../utils/gracePeriod';
import VerifiedBadge from '../../components/VerifiedBadge';
import EmptyStateScreen from './EmptyStateScreen';
import { ResponsiveContainer, useBreakpoints } from '../../core/responsive';

// Fallback high-fidelity candidate profiles
const MOCK_DISCOVERY_PROFILES = [
  {
    id: 'disc-1',
    name: 'Elena',
    age: 28,
    isVerified: true,
    matchScore: 94,
    isOnline: true,
    distance: '1.2 miles away',
    cityName: 'Pune',
    lookingFor: 'Looking for a Spark',
    bio: '"Curating moments at local galleries, vintage book hunting, and probably drinking too much espresso on rainy afternoons."',
    hashtags: ['#Jazz', '#Hiking', '#Wine'],
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    ],
    occupation: 'Creative Director',
  },
  {
    id: 'disc-2',
    name: 'Lucas',
    age: 30,
    isVerified: true,
    matchScore: 88,
    isOnline: true,
    distance: '0.8 miles away',
    cityName: 'Pune',
    lookingFor: 'Serious Connection',
    bio: '"Building structures by day, exploring hidden rooftops by night. Seeking someone who enjoys deep talks and acoustic sessions."',
    hashtags: ['#Architecture', '#Travel', '#Coffee'],
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
    ],
    occupation: 'Architect',
  },
  {
    id: 'disc-3',
    name: 'Sophia',
    age: 26,
    isVerified: true,
    matchScore: 91,
    isOnline: false,
    distance: '2.1 miles away',
    cityName: 'Pune',
    lookingFor: 'Friendship First',
    bio: '"Foodie & concert junkie. Looking for someone to trade playlists with."',
    hashtags: ['#Music', '#Foodie', '#Concerts'],
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    ],
    occupation: 'UI/UX Designer',
  },
];

// New Members Carousel Data
const NEW_MEMBERS = [
  { id: 'm-1', name: 'Marc', age: 31, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
  { id: 'm-2', name: 'Sophie', age: 26, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { id: 'm-3', name: 'Leo', age: 29, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { id: 'm-4', name: 'Chloe', age: 27, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { id: 'm-5', name: 'Aria', age: 25, photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80' },
];

export default function DiscoverScreen({ navigation, route }: any) {
  const { width, height, isPhone } = useBreakpoints();
  const SWIPE_THRESHOLD = 0.28 * width;
  const { colors: Colors } = useTheme();
  const styles = createStyles(width, height, Colors, isPhone);
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();

  // Core States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSwipedProfile, setLastSwipedProfile] = useState<any>(null);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, boolean>>({});
  const rewindTimeout = useRef<any>(null);
  const position = useRef(new Animated.ValueXY()).current;

  // Filter & Search Modals State
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [nearMeFilter, setNearMeFilter] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter Form State
  const [filterDistance, setFilterDistance] = useState(25);
  const [filterMinAge, setFilterMinAge] = useState(18);
  const [filterMaxAge, setFilterMaxAge] = useState(35);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { captureLocation } = useLocationCapture({
    user,
    profile,
    onLocationSaved: (updatedProfile) => {
      setProfile(updatedProfile);
      setRefreshTrigger((prev) => prev + 1);
    },
  });

  const [likesCount, setLikesCount] = useState(0);
  const FREE_DAILY_LIKES = 10;
  const [swipeCount, setSwipeCount] = useState(0);
  const [inGracePeriod, setInGracePeriod] = useState(false);

  useEffect(() => {
    getGracePeriodStatus().then(setInGracePeriod);
  }, []);

  useDeferredOnboardingPrompts({
    swipeCount,
    hasMatched: false,
    signupTimestamp: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
    hasPassword: false,
  });

  // Subscribe to profiles from backend
  const setupSubscription = useCallback(() => {
    if (route?.params?.profiles && route.params.profiles.length > 0) {
      setProfiles(route.params.profiles);
      setLoading(false);
      navigation.setParams({ profiles: undefined });
      return () => {};
    }

    if (user && profile) {
      if (!profile.location?.latitude) {
        setLoading(true);
        captureLocation();
        return () => {};
      }

      setLoading(true);
      const unsubscribe = subscribeToPotentialMatches(user.uid, profile, (potential) => {
        if (potential && potential.length > 0) {
          const enriched = potential.map((p) => ({
            ...p,
            matchScore: p.matchScore || Math.floor(Math.random() * 12 + 86),
            isOnline: p.isOnline !== undefined ? p.isOnline : true,
            lookingFor: p.lookingFor || 'Looking for a Spark',
            bio: p.bio || '"Living each day with curiosity, passion, and kindness."',
            hashtags: p.interests && p.interests.length > 0
              ? p.interests.slice(0, 3).map((i: string) => `#${i}`)
              : ['#Coffee', '#Music', '#Travel'],
            photos: Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'],
            distance: p.distance ? `${p.distance} miles away` : '1.5 miles away',
          }));
          setProfiles(enriched);
        } else {
          setProfiles(MOCK_DISCOVERY_PROFILES);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setProfiles(MOCK_DISCOVERY_PROFILES);
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

  // Animations & PanResponder
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 12 || Math.abs(gestureState.dy) > 12;
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

  const forceSwipe = (direction: string) => {
    if (profiles.length === 0) return;

    if (direction === 'right' && !profile?.isPremium && !inGracePeriod && likesCount >= FREE_DAILY_LIKES) {
      navigation.navigate('Profile', { screen: 'Premium' });
      resetPosition();
      return;
    }

    const x = direction === 'right' ? width + 120 : direction === 'left' ? -width - 120 : 0;
    const y = direction === 'up' ? -height - 120 : 0;
    Animated.timing(position, {
      toValue: { x, y },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = async (direction: string) => {
    setSwipeCount((prev) => prev + 1);
    const swipedProfile = profiles[0];
    setProfiles((prev) => prev.slice(1));
    setActivePhotoIndex(0);
    position.setValue({ x: 0, y: 0 });

    notifyDeckSwipe();

    if (direction === 'left') {
      setLastSwipedProfile(swipedProfile);
      if (rewindTimeout.current) clearTimeout(rewindTimeout.current);
      rewindTimeout.current = setTimeout(() => setLastSwipedProfile(null), 5000);
    } else {
      setLastSwipedProfile(null);
      if (direction === 'right' || direction === 'up') setLikesCount((prev) => prev + 1);
    }

    if (user && swipedProfile) {
      try {
        const matchResult = await recordSwipe(user.uid, swipedProfile.id, direction, swipedProfile);
        if (matchResult) {
          navigation.navigate('Match', {
            matchProfile: matchResult.matchedUser,
            matchId: matchResult.id,
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

  const handleToggleSave = (id: string) => {
    setSavedProfiles((prev) => ({ ...prev, [id]: !prev[id] }));
    Alert.alert(savedProfiles[id] ? 'Removed' : 'Saved 🔖', savedProfiles[id] ? 'Profile removed from saved.' : 'Profile saved to your bookmarks.');
  };

  // Filter profiles based on Quick Pills
  const displayProfiles = profiles.filter((p) => {
    if (verifiedOnly && !p.isVerified) return false;
    if (nearMeFilter && p.distance && parseFloat(p.distance) > 5) return false;
    return true;
  });

  return (
    <ResponsiveContainer safeArea={false} centered={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header Bar ────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <Text style={styles.brandWordmark}>Lovly</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setSearchModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Search Profiles"
          >
            <Ionicons name="search-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Alert.alert('Notifications 🔔', 'You have no new notifications.')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setFilterModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Filter Options"
          >
            <Ionicons name="options-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── New Members Horizontal Carousel ───────────────────────────── */}
        <View style={styles.newMembersSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.serifSectionTitle}>New Members</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersRow}
          >
            {NEW_MEMBERS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.memberItem}
                onPress={() => Alert.alert(`New Member: ${m.name}`, `${m.name}, ${m.age} just joined Lovly in Pune!`)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`New member ${m.name}`}
              >
                <View style={styles.memberAvatarRing}>
                  <Image source={{ uri: m.photo }} style={styles.memberAvatarImg} />
                </View>
                <Text style={styles.memberName}>{m.name}, {m.age}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Quick Filter Pills ────────────────────────────────────────── */}
        <View style={styles.pillFilterRow}>
          <TouchableOpacity
            style={[styles.filterPill, verifiedOnly && styles.filterPillActive]}
            onPress={() => setVerifiedOnly(!verifiedOnly)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Toggle Verified Only"
          >
            <Ionicons
              name={verifiedOnly ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={14}
              color={verifiedOnly ? '#FFF' : Colors.textMuted}
            />
            <Text style={[styles.filterPillText, verifiedOnly && styles.filterPillTextActive]}>
              Verified Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, nearMeFilter && styles.filterPillActive]}
            onPress={() => setNearMeFilter(!nearMeFilter)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Filter Near Me"
          >
            <Text style={[styles.filterPillText, nearMeFilter && styles.filterPillTextActive]}>
              Near Me
            </Text>
          </TouchableOpacity>

          <View style={styles.curatedChip}>
            <Text style={styles.curatedChipText}>Curated for you</Text>
          </View>
        </View>

        {/* ── Organic Sculpted Feed / Candidate Cards ────────────────────── */}
        <View style={styles.feedWrap}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>FINDING YOUR SPARK...</Text>
            </View>
          ) : displayProfiles.length === 0 ? (
            <EmptyStateScreen
              navigation={navigation}
              inline={true}
              route={{
                params: {
                  currentRadius: profile?.distance_range ?? 25,
                  userLocation: profile?.location ?? null,
                },
              }}
            />
          ) : (
            displayProfiles.map((item, index) => {
              if (index > 2) return null; // Stack depth limit for performance

              const isFirst = index === 0;

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.sculptedCard,
                    isFirst && {
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { rotate: rotate },
                      ],
                      zIndex: 10,
                    },
                    !isFirst && {
                      transform: [{ scale: 0.95 - index * 0.03 }],
                      marginTop: index * 10,
                    },
                  ]}
                  {...(isFirst ? panResponder.panHandlers : {})}
                >
                  {/* Organic Sculpted Photo Frame */}
                  <View style={styles.photoFrame}>
                    <Image
                      source={{ uri: item.photos?.[activePhotoIndex] || item.photos?.[0] }}
                      style={styles.heroPhoto}
                    />

                    {/* AI Match % Badge floating top right */}
                    <View style={styles.matchBadgeFloating}>
                      <Ionicons name="sparkles" size={12} color="#FFF" />
                      <Text style={styles.matchBadgeText}>{item.matchScore}% Match</Text>
                    </View>

                    {/* Online status indicator */}
                    {item.isOnline && <View style={styles.heroOnlineDot} />}

                    {/* Photo Carousel Dots */}
                    {item.photos && item.photos.length > 1 && (
                      <View style={styles.carouselDots}>
                        {item.photos.map((_: any, pIdx: number) => (
                          <TouchableOpacity
                            key={pIdx}
                            onPress={() => setActivePhotoIndex(pIdx)}
                            style={[
                              styles.dot,
                              activePhotoIndex === pIdx && styles.dotActive,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Card Content Body */}
                  <View style={styles.cardContent}>
                    {/* Name & Verified Badge */}
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                      {item.isVerified && <VerifiedBadge size={18} />}
                    </View>

                    {/* Location & Distance */}
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.locationText}>{item.distance || '1.2 miles away'}</Text>
                    </View>

                    {/* Looking For Tag */}
                    {item.lookingFor && (
                      <View style={styles.lookingForPill}>
                        <Text style={styles.lookingForText}>{item.lookingFor}</Text>
                      </View>
                    )}

                    {/* Romantic Bio Quote */}
                    <Text style={styles.bioQuote}>{item.bio}</Text>

                    {/* Hashtags */}
                    {item.hashtags && (
                      <View style={styles.hashtagRow}>
                        {item.hashtags.map((tag: string, tIdx: number) => (
                          <View key={tIdx} style={styles.hashtagChip}>
                            <Text style={styles.hashtagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Premium Action Row */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.circleActionBtn}
                        onPress={() => forceSwipe('left')}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Pass Profile"
                      >
                        <Ionicons name="close" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.circleActionBtn}
                        onPress={() => handleToggleSave(item.id)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Bookmark Profile"
                      >
                        <Ionicons
                          name={savedProfiles[item.id] ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={savedProfiles[item.id] ? Colors.primary : Colors.textMuted}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.circleActionBtn}
                        onPress={() => forceSwipe('up')}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Super Like Profile"
                      >
                        <Ionicons name="star" size={18} color={Colors.gold} />
                      </TouchableOpacity>

                      {/* Main Connect Button */}
                      <TouchableOpacity
                        style={styles.connectBtnWrap}
                        onPress={() => forceSwipe('right')}
                        activeOpacity={0.9}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Connect with Profile"
                      >
                        <LinearGradient
                          colors={['#E8628F', '#C53D6B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.connectBtnGradient}
                        >
                          <Ionicons name="heart" size={18} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.connectBtnText}>Connect</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Bottom loading indicator */}
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.footerLoaderText}>FINDING YOUR SPARK...</Text>
        </View>
      </ScrollView>

      {/* ── Search Modal ─────────────────────────────────────────────────── */}
      <Modal visible={searchModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.searchBarInputWrap}>
              <Ionicons name="search" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInputText}
                placeholder="Search by name, vibe or interest..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingTop: 16 }}>
            <Text style={styles.modalSubHeader}>SUGGESTED VIBES</Text>
            <View style={styles.tagWrap}>
              {['#Night Owls', '#Creatives', '#Foodies', '#Active Life', '#Jazz', '#Coffee'].map((t) => (
                <TouchableOpacity key={t} style={styles.vibeTagChip} onPress={() => setSearchQuery(t.replace('#', ''))}>
                  <Text style={styles.vibeTagChipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Advanced Filter Sheet ─────────────────────────────────────────── */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={styles.filterOverlay}>
          <View style={[styles.filterSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Verified Only</Text>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Online Now Only</Text>
              <Switch
                value={onlineOnly}
                onValueChange={setOnlineOnly}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (width: number, height: number, Colors: any, isPhone: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#14051A' },
    headerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: 10,
    },
    brandWordmark: {
      fontSize: 28,
      fontWeight: '800',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    headerRightActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    notifBadgeDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.error,
    },

    scrollContent: { paddingBottom: 100 },

    newMembersSection: { marginTop: 10, paddingHorizontal: Spacing.xl },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    serifSectionTitle: { fontSize: 20, fontWeight: '400', color: Colors.text, fontFamily: Typography.fontFamily.serif },
    seeAllText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
    membersRow: { gap: 16, paddingRight: Spacing.xl },
    memberItem: { alignItems: 'center' },
    memberAvatarRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: Colors.primary, padding: 2 },
    memberAvatarImg: { width: '100%', height: '100%', borderRadius: 28 },
    memberName: { fontSize: 11, fontWeight: '600', color: Colors.text, marginTop: 4 },

    pillFilterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.xl, marginTop: 18, marginBottom: 16, alignItems: 'center' },
    filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
    filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterPillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    filterPillTextActive: { color: '#FFF' },
    curatedChip: { marginLeft: 'auto' },
    curatedChipText: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },

    feedWrap: { paddingHorizontal: Spacing.xl, alignItems: 'center', minHeight: 480 },
    loadingCard: { height: 400, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1.5, marginTop: 12 },

    sculptedCard: {
      width: isPhone ? width - Spacing.xl * 2 : 420,
      backgroundColor: '#1D0B26',
      borderRadius: Radius['3xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      ...Shadow.lg,
    },
    photoFrame: { width: '100%', height: 320, borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'], overflow: 'hidden' },
    heroPhoto: { width: '100%', height: '100%' },
    matchBadgeFloating: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(20,5,26,0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    matchBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
    heroOnlineDot: { position: 'absolute', top: 20, right: 120, width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C48C', borderWidth: 2, borderColor: '#14051A' },
    carouselDots: { position: 'absolute', bottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { width: 16, backgroundColor: '#FFF' },

    cardContent: { padding: 20 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locationText: { fontSize: 12, color: Colors.textMuted },
    lookingForPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(233,75,115,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, marginTop: 12 },
    lookingForText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    bioQuote: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: Typography.fontFamily.serif, fontStyle: 'italic', marginTop: 12, lineHeight: 19 },
    hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    hashtagChip: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
    hashtagText: { fontSize: 11, color: Colors.textMuted },

    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
    circleActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    connectBtnWrap: { flex: 1, marginLeft: 12, height: 46, borderRadius: Radius.full, overflow: 'hidden' },
    connectBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    connectBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

    footerLoader: { alignItems: 'center', marginTop: 24, paddingBottom: 20 },
    footerLoaderText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5, marginTop: 8 },

    modalContainer: { flex: 1, backgroundColor: '#14051A', paddingHorizontal: Spacing.xl },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    searchBarInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', height: 44, borderRadius: Radius.full, paddingHorizontal: 14 },
    searchInputText: { flex: 1, fontSize: 14, color: Colors.text },
    cancelText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
    modalSubHeader: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    vibeTagChip: { backgroundColor: 'rgba(233,75,115,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
    vibeTagChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

    filterOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    filterSheet: { backgroundColor: '#1D0B26', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    filterSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterSheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    filterLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
    applyBtn: { backgroundColor: Colors.primary, height: 48, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  });
