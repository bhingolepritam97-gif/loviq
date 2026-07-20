import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
  FlatList,
  Platform,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { recordSwipe } from '../../services/DiscoverService';
import VerifiedBadge from '../../components/VerifiedBadge';
import { ResponsiveContainer, useBreakpoints } from '../../core/responsive';

// ── Curated Vibe Collections ────────────────────────────────────────────────
const VIBE_COLLECTIONS = [
  {
    id: 'nightlife',
    number: 'COLLECTION 01',
    title: 'Night Owls',
    tagline: 'For the seekers of jazz, late-night talks, and city lights.',
    actionText: 'VIEW VIBE →',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    color: ['#1e102d', '#0d0414'],
    accentColor: '#a78bfa',
    filterVibe: 'nightlife',
  },
  {
    id: 'creative',
    number: 'COLLECTION 02',
    title: 'Creatives',
    tagline: 'Art, music, and design lovers connecting through soul.',
    actionText: 'EXPLORE →',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    color: ['#28102a', '#100312'],
    accentColor: '#f472b6',
    filterVibe: 'creative',
  },
  {
    id: 'foodie',
    number: 'COLLECTION 03',
    title: 'Foodies',
    tagline: 'Coffee snobs, secret dim-sum spots, and fine dining dates.',
    actionText: 'DISCOVER →',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    color: ['#2b1c0b', '#120b04'],
    accentColor: '#fbbf24',
    filterVibe: 'foodie',
  },
  {
    id: 'active',
    number: 'COLLECTION 04',
    title: 'Active Life',
    tagline: 'Sunrise yoga, weekend hikes, and outdoor adventures.',
    actionText: 'JOIN IN →',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    color: ['#0b232b', '#041014'],
    accentColor: '#60a5fa',
    filterVibe: 'active',
  },
  {
    id: 'chill',
    number: 'COLLECTION 05',
    title: 'Chill Vibes',
    tagline: 'Acoustic playlists, bookstore afternoons, and movie nights.',
    actionText: 'CHILL OUT →',
    image: 'https://images.unsplash.com/photo-1528747045269-390fe33c19f2?w=800&q=80',
    color: ['#0d2319', '#04100b'],
    accentColor: '#34d399',
    filterVibe: 'chill',
  },
];

// Fallback profiles for seamless loading
const MOCK_PROFILES = [
  {
    id: 'exp-1',
    name: 'Elena',
    age: 28,
    isVerified: true,
    occupation: 'Creative Director',
    distance: '2.4 miles',
    cityName: 'Pune',
    matchScore: 96,
    isOnline: true,
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'],
    bio: 'Architect of quiet moments & loud laughter. Vinyl collector & espresso enthusiast.',
    interests: ['Art & Design', 'Vinyl', 'Espresso', 'Jazz Bars'],
  },
  {
    id: 'exp-2',
    name: 'Julian',
    age: 30,
    isVerified: true,
    occupation: 'Architect',
    distance: '3.1 miles',
    cityName: 'Pune',
    matchScore: 92,
    isOnline: false,
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
    bio: 'Designing space for serendipity. Searching for a partner in culinary crimes.',
    interests: ['Architecture', 'Natural Wine', 'Photography'],
  },
  {
    id: 'exp-3',
    name: 'Sasha',
    age: 25,
    isVerified: true,
    occupation: 'UX Designer',
    distance: '0.4 miles',
    cityName: 'Pune',
    matchScore: 94,
    isOnline: true,
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80'],
    bio: 'Sunset painter & night-owl podcast listener.',
    interests: ['UI/UX', 'Indie Pop', 'Bouldering'],
  },
  {
    id: 'exp-4',
    name: 'Marc',
    age: 29,
    isVerified: false,
    occupation: 'Software Engineer',
    distance: '0.8 miles',
    cityName: 'Pune',
    matchScore: 89,
    isOnline: true,
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80'],
    bio: 'Tech enthusiast who loves weekend road trips and acoustic jamming.',
    interests: ['Coding', 'Guitars', 'Road Trips'],
  },
  {
    id: 'exp-5',
    name: 'Aria',
    age: 26,
    isVerified: true,
    occupation: 'Fashion Stylist',
    distance: '1.2 miles',
    cityName: 'Pune',
    matchScore: 98,
    isOnline: true,
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80'],
    bio: 'Caffeine dependent lifeform. Always hunting for vintage leather jackets.',
    interests: ['Fashion', 'Vintage', 'Cocktails'],
  },
];

export default function ExploreScreen({ navigation }: any) {
  const { width: windowWidth, isPhone } = useBreakpoints();
  const containerWidth = isPhone ? windowWidth : 480;
  const cardWidth = containerWidth * 0.72;
  const { colors: Colors } = useTheme();
  const styles = createStyles(windowWidth, Colors, isPhone);
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  // State
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, boolean>>({});

  // Filter States
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [ageRange, setAgeRange] = useState([18, 35]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch profiles from API
  const fetchExploreData = useCallback(async () => {
    if (!user || !profile) {
      setTopPicks(MOCK_PROFILES);
      setNearbyUsers(MOCK_PROFILES.slice(2));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient('/deck/top-picks', { cache: true, ttl: 300000 });
      if (response && response.success && Array.isArray(response.candidates) && response.candidates.length > 0) {
        const formatted = response.candidates.map((c: any) => ({
          ...c,
          matchScore: c.matchScore || Math.floor(Math.random() * 10 + 88),
          isOnline: c.isOnline !== undefined ? c.isOnline : true,
          photos: Array.isArray(c.photos)
            ? c.photos.map((p: any) => (typeof p === 'string' ? p : p.url))
            : [c.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'],
          distance: c.distance_meters != null
            ? `${(c.distance_meters / 1609.34).toFixed(1)} miles`
            : c.distance || '2.5 miles',
        }));
        setTopPicks(formatted);
        setNearbyUsers(formatted.slice(0, 4));
      } else {
        setTopPicks(MOCK_PROFILES);
        setNearbyUsers(MOCK_PROFILES.slice(2));
      }
    } catch (err) {
      console.warn('[ExploreScreen] API fetch fallback to mock data:', err);
      setTopPicks(MOCK_PROFILES);
      setNearbyUsers(MOCK_PROFILES.slice(2));
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchExploreData();
  }, [fetchExploreData]);

  // Action handlers
  const handleLike = async (item: any) => {
    if (user) {
      await recordSwipe(user.uid, item.id, 'right', item);
    }
    Alert.alert('Liked 💕', `You expressed interest in ${item.name}!`);
  };

  const handlePass = (item: any) => {
    setTopPicks((prev) => prev.filter((p) => p.id !== item.id));
  };

  const handleToggleSave = (item: any) => {
    setSavedProfiles((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

  const isPremium = profile?.isPremium;

  // Filtered profiles for Search
  const filteredTopPicks = topPicks.filter((p) => {
    if (verifiedOnly && !p.isVerified) return false;
    if (onlineOnly && !p.isOnline) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const bioMatch = p.bio?.toLowerCase().includes(q);
      const interestMatch = p.interests?.some((i: string) => i.toLowerCase().includes(q));
      return nameMatch || bioMatch || interestMatch;
    }
    return true;
  });

  return (
    <ResponsiveContainer safeArea={false} centered={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <Animated.View style={[styles.headerBar, { transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandWordmark}>Lovly</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setSearchModalVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open Search"
            >
              <Ionicons name="search-outline" size={20} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFilterModalVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open Filters"
            >
              <Ionicons name="options-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headlineWrap}>
          <Text style={styles.categoryLabel}>DISCOVERY</Text>
          <Text style={styles.heroHeadline}>Curated for the soulful.</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Search Bar Input Trigger ───────────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBarTrigger}
          activeOpacity={0.9}
          onPress={() => setSearchModalVisible(true)}
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel="Search by name or vibe"
        >
          <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 10 }} />
          <Text style={styles.searchPlaceholderText}>Search by name, vibe or interest...</Text>
          <View style={styles.filterChipSmall}>
            <Ionicons name="options" size={14} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* ── Section 1: Find Your Vibe (Curated Collections) ────────────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionSerifTitle}>Find your Vibe</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Discover')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View All Vibes"
            >
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibeCarousel}
          >
            {VIBE_COLLECTIONS.map((vibe) => (
              <TouchableOpacity
                key={vibe.id}
                style={styles.vibeCardOval}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Discover', { filterVibe: vibe.filterVibe })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Collection ${vibe.title}`}
              >
                <Image source={{ uri: vibe.image }} style={styles.vibeImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(18, 5, 26, 0.88)', '#12051A']}
                  style={styles.vibeGradientOverlay}
                >
                  <Text style={styles.vibeNumber}>{vibe.number}</Text>
                  <Text style={styles.vibeTitle}>{vibe.title}</Text>
                  <Text style={styles.vibeTagline} numberOfLines={2}>
                    {vibe.tagline}
                  </Text>
                  <View style={styles.vibeActionRow}>
                    <Text style={[styles.vibeActionText, { color: vibe.accentColor }]}>
                      {vibe.actionText}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Section 2: Passport Mode / Travel Card ─────────────────────── */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            style={styles.passportCard}
            activeOpacity={0.92}
            onPress={() =>
              isPremium
                ? Alert.alert('Passport Mode ✈️', 'Choose any city globally to swipe and meet people before your trip!')
                : navigation.navigate('Premium')
            }
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Passport Mode: Swipe around the world"
          >
            <LinearGradient
              colors={['#271236', '#170924', '#12051A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passportGradient}
            >
              <View style={styles.passportHeader}>
                <View style={styles.passportBadge}>
                  <Ionicons name="globe-outline" size={16} color={Colors.primary} />
                  <Text style={styles.passportBadgeText}>Passport Mode</Text>
                </View>
                <View style={styles.globeGlowIcon}>
                  <Ionicons name="planet-outline" size={32} color="rgba(233,75,115,0.4)" />
                </View>
              </View>

              <Text style={styles.passportTitle}>Swipe around the world</Text>
              <Text style={styles.passportDesc}>
                Explore connections in any city globally. Your next great story might be across the ocean.
              </Text>

              <View style={styles.unlockBtnWrap}>
                <LinearGradient
                  colors={['#E8628F', '#C53D6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.unlockBtnGradient}
                >
                  <Text style={styles.unlockBtnText}>
                    {isPremium ? 'Select City' : 'Unlock Travel'}
                  </Text>
                </LinearGradient>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Section 3: Recommended Profiles (Horizontal Rich Cards) ────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionSerifTitle}>Recommended</Text>
              <Text style={styles.sectionSubtitleSmall}>90%+ Compatibility</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedCarousel}
            >
              {filteredTopPicks.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.richCard}
                  activeOpacity={0.92}
                  onPress={() => {
                    if (!isPremium && idx > 1) {
                      navigation.navigate('Premium');
                    } else {
                      navigation.navigate('ProfileDetail', { profile: item });
                    }
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Recommended profile ${item.name}`}
                >
                  <Image
                    source={{ uri: item.photos?.[0] }}
                    style={styles.richCardImage}
                    contentFit="cover"
                    transition={300}
                  />

                  {/* Lock overlay for non-premium */}
                  {!isPremium && idx > 1 && (
                    <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
                  )}

                  <LinearGradient
                    colors={['transparent', 'rgba(18,5,26,0.65)', 'rgba(18,5,26,0.98)']}
                    style={styles.richCardGradient}
                  >
                    {/* Top Badges */}
                    <View style={styles.badgeRow}>
                      <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>{item.matchScore}% Match</Text>
                      </View>
                      {item.isOnline && (
                        <View style={styles.onlinePill}>
                          <View style={styles.onlineDot} />
                          <Text style={styles.onlinePillText}>Online</Text>
                        </View>
                      )}
                    </View>

                    {/* Profile Details */}
                    <View style={styles.cardInfoWrap}>
                      <View style={styles.nameRow}>
                        <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                        {item.isVerified && <VerifiedBadge size={16} />}
                      </View>

                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {item.occupation ? `${item.occupation} • ` : ''}{item.distance}
                      </Text>

                      {/* Action Buttons */}
                      <View style={styles.cardActionRow}>
                        <TouchableOpacity
                          style={styles.actionCircleBtn}
                          onPress={() => handlePass(item)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel="Pass Profile"
                        >
                          <Ionicons name="close" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionCircleBtn, styles.likeBtnActive]}
                          onPress={() => handleLike(item)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel="Like Profile"
                        >
                          <Ionicons name="heart" size={18} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionCircleBtn}
                          onPress={() => handleToggleSave(item)}
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
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Section 4: Quick Vibe Chips (Trending & Verified) ─────────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.gridTwoRow}>
            <TouchableOpacity
              style={styles.quickVibeTile}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Discover', { filterVibe: 'active' })}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Trending Profiles"
            >
              <View style={styles.tileIconWrap}>
                <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.tileTitle}>Trending</Text>
              <Text style={styles.tileSub}>Most active now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickVibeTile}
              activeOpacity={0.88}
              onPress={() => setVerifiedOnly((prev) => !prev)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Toggle Verified Only"
            >
              <View style={styles.tileHeaderRow}>
                <View style={styles.tileIconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#34d399" />
                </View>
                <Switch
                  value={verifiedOnly}
                  onValueChange={setVerifiedOnly}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              <Text style={styles.tileTitle}>Verified</Text>
              <Text style={styles.tileSub}>Only authentic souls</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 5: Nearby Users (Avatar Carousel) ───────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionSerifTitle}>Nearby</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyRow}
          >
            {nearbyUsers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.nearbyAvatarItem}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Nearby user ${item.name}`}
              >
                <View style={styles.avatarRing}>
                  <Image
                    source={{ uri: item.photos?.[0] }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                  {item.isOnline && <View style={styles.avatarOnlineBadge} />}
                </View>
                <Text style={styles.nearbyName}>{item.name}, {item.age}</Text>
                <Text style={styles.nearbyDist}>{item.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Search Modal ─────────────────────────────────────────────────── */}
      <Modal visible={searchModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalSearchInputWrap}>
              <Ionicons name="search" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search by name, vibe or interest..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSearchModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {searchQuery.trim() === '' ? (
              <View>
                <Text style={styles.modalSubtitle}>SUGGESTED VIBES</Text>
                <View style={styles.tagWrap}>
                  {['Night Owls', 'Creatives', 'Foodies', 'Active Life', 'Chill Vibes', 'Verified'].map(
                    (tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.tagChip}
                        onPress={() => setSearchQuery(tag)}
                      >
                        <Text style={styles.tagChipText}># {tag}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSubtitle}>RESULTS ({filteredTopPicks.length})</Text>
                {filteredTopPicks.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSearchModalVisible(false);
                      navigation.navigate('ProfileDetail', { profile: item });
                    }}
                  >
                    <Image source={{ uri: item.photos?.[0] }} style={styles.searchResultAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}, {item.age}</Text>
                      <Text style={styles.searchResultBio} numberOfLines={1}>
                        {item.bio || item.occupation || 'Near Pune'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Advanced Filter Modal ────────────────────────────────────────── */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={styles.filterOverlay}>
          <View style={[styles.filterSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filter Connections</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Verified Profiles Only</Text>
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

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (width: number, Colors: any, isPhone: boolean) => {
  const containerWidth = isPhone ? width : 480;
  const cardWidth = containerWidth * 0.72;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#12051A' },
    headerBar: { paddingHorizontal: Spacing.xl, paddingTop: 6, paddingBottom: 12 },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandWordmark: { fontSize: 26, fontWeight: '800', color: Colors.text, fontFamily: Typography.fontFamily.serif },
    headerIcons: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    
    headlineWrap: { marginTop: 14 },
    categoryLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1.5 },
    heroHeadline: { fontSize: 28, fontWeight: '400', color: Colors.text, fontFamily: Typography.fontFamily.serif, marginTop: 2 },

    scrollContent: { paddingBottom: 120 },

    searchBarTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginHorizontal: Spacing.xl,
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 16,
      height: 48,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    searchPlaceholderText: { flex: 1, fontSize: 13, color: Colors.textMuted },
    filterChipSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(233,75,115,0.15)', justifyContent: 'center', alignItems: 'center' },

    sectionWrap: { marginTop: 20, paddingHorizontal: Spacing.xl },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    sectionSerifTitle: { fontSize: 22, fontWeight: '400', color: Colors.text, fontFamily: Typography.fontFamily.serif },
    sectionSubtitleSmall: { fontSize: 11, color: Colors.primary, marginTop: 2, fontWeight: '600' },
    viewAllText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },

    vibeCarousel: { paddingRight: Spacing.xl, gap: 14 },
    vibeCardOval: { width: 210, height: 290, borderRadius: 100, overflow: 'hidden', backgroundColor: Colors.surface },
    vibeImage: { width: '100%', height: '100%' },
    vibeGradientOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20, paddingBottom: 24, alignItems: 'center' },
    vibeNumber: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
    vibeTitle: { fontSize: 22, fontWeight: '400', color: '#FFF', fontFamily: Typography.fontFamily.serif, textAlign: 'center' },
    vibeTagline: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 6, lineHeight: 16 },
    vibeActionRow: { marginTop: 12 },
    vibeActionText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    passportCard: { borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(233,75,115,0.3)', ...Shadow.md },
    passportGradient: { padding: 22 },
    passportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    passportBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(233,75,115,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    passportBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    globeGlowIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    passportTitle: { fontSize: 20, fontWeight: '400', color: Colors.text, fontFamily: Typography.fontFamily.serif },
    passportDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
    unlockBtnWrap: { marginTop: 16, alignSelf: 'flex-start' },
    unlockBtnGradient: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: Radius.full },
    unlockBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

    recommendedCarousel: { paddingRight: Spacing.xl, gap: 16 },
    richCard: { width: cardWidth, height: cardWidth * 1.4, borderRadius: Radius['2xl'], overflow: 'hidden', backgroundColor: Colors.surface },
    richCardImage: { width: '100%', height: '100%' },
    richCardGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    matchPill: { backgroundColor: 'rgba(241,213,165,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    matchPillText: { fontSize: 10, fontWeight: '800', color: '#14051A' },
    onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C48C' },
    onlinePillText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
    cardInfoWrap: { width: '100%' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardName: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    cardActionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
    actionCircleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    likeBtnActive: { backgroundColor: Colors.primary },

    gridTwoRow: { flexDirection: 'row', gap: 14 },
    quickVibeTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.xl, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tileIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    tileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tileTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    tileSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

    nearbyRow: { gap: 16, paddingRight: Spacing.xl },
    nearbyAvatarItem: { alignItems: 'center' },
    avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.primary, padding: 2 },
    avatarImg: { width: '100%', height: '100%', borderRadius: 30 },
    avatarOnlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#00C48C', borderWidth: 2, borderColor: '#12051A' },
    nearbyName: { fontSize: 12, fontWeight: '700', color: Colors.text, marginTop: 6 },
    nearbyDist: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

    modalContainer: { flex: 1, backgroundColor: '#12051A', paddingHorizontal: Spacing.xl },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    modalSearchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', height: 44, borderRadius: Radius.full, paddingHorizontal: 14 },
    modalSearchInput: { flex: 1, fontSize: 14, color: Colors.text },
    closeBtn: { paddingHorizontal: 4 },
    closeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    modalBody: { flex: 1, paddingTop: 16 },
    modalSubtitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tagChip: { backgroundColor: 'rgba(233,75,115,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
    tagChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    searchResultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    searchResultAvatar: { width: 44, height: 44, borderRadius: 22 },
    searchResultName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    searchResultBio: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

    filterOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    filterSheet: { backgroundColor: '#1D0B26', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    filterSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterSheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    filterLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
    applyFilterBtn: { backgroundColor: Colors.primary, height: 48, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    applyFilterText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  });
};
