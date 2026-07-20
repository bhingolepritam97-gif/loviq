import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
import { fetchUserProfile } from '../../services/UserService';
import { Skeleton } from '../../components/Skeleton';
import { ResponsiveContainer, useBreakpoints } from '../../core/responsive';

const numColumns = 2;
const cardMargin = Spacing.md;

export default function LikesYouScreen({ navigation }: any) {
  const { width: windowWidth, isPhone } = useBreakpoints();
  const containerWidth = isPhone ? windowWidth : 480;
  const cardWidth = (containerWidth - Spacing.xl * 2 - cardMargin) / numColumns;
  const cardHeight = cardWidth * 1.45;
  const { colors: Colors } = useTheme();
  const styles = createStyles(cardWidth, cardHeight, Colors);
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [likes, setLikes] = useState<any[]>([]);
  const [sentLikes, setSentLikes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingDetailId, setFetchingDetailId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSwipesData = async () => {
    if (!user) return;
    setError(null);
    try {
      // 1. Fetch Received Likes (other users who liked me) from backend
      const resReceived = await apiClient('/swipes/likes', { cache: true, ttl: 300000 });
      if (resReceived && resReceived.success && Array.isArray(resReceived.likes)) {
        const likers = resReceived.likes.map((like: any) => {
          let age = 28;
          if (like.user?.birthdate) {
            const birth = new Date(like.user.birthdate);
            age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          }
          return {
            id: like.user?.id || `like-${Math.random()}`,
            name: like.user?.name || 'Secret Admirer',
            age,
            occupation: like.user?.occupation || 'Creative Soul',
            photos: like.user?.photos && like.user.photos.length > 0 ? [like.user.photos[0].url] : ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
            isSuperLike: like.direction === 'superlike',
            message: like.commentText || null,
            cityName: like.user?.cityName || 'Pune',
            isActiveNow: true,
          };
        });
        setLikes(likers.length > 0 ? likers : MOCK_ADMIRERS);
      } else {
        setLikes(MOCK_ADMIRERS);
      }

      // 2. Fetch Sent Likes
      const resSent = await apiClient('/swipes/sent', { cache: true, ttl: 300000 });
      if (resSent && resSent.success && Array.isArray(resSent.likes)) {
        const liked = resSent.likes.map((like: any) => ({
          id: like.user?.id || `sent-${Math.random()}`,
          name: like.user?.name || 'Target Soul',
          age: 27,
          photos: like.user?.photos && like.user.photos.length > 0 ? [like.user.photos[0].url] : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'],
          isSuperLike: like.direction === 'superlike',
          cityName: like.user?.cityName || 'Pune',
        }));
        setSentLikes(liked);
      }
    } catch (err) {
      console.warn('Error fetching swipes, using fallback:', err);
      setLikes(MOCK_ADMIRERS);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchSwipesData();
      setLoading(false);
    };
    initialLoad();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSwipesData();
    setRefreshing(false);
  };

  const isPremium = profile?.isPremium;
  const showUnblurred = activeTab === 'sent' || isPremium;

  const renderAdmirerCard = ({ item, index }: { item: any; index: number }) => {
    // Show first 2 cards unblurred for preview effect if non-premium demo
    const isUnlocked = showUnblurred || index < 2;

    return (
      <TouchableOpacity
        style={styles.admirerCard}
        activeOpacity={0.9}
        onPress={async () => {
          if (!isUnlocked) {
            navigation.navigate('Premium');
            return;
          }
          if (fetchingDetailId) return;
          setFetchingDetailId(item.id);
          try {
            const fullProfile = await fetchUserProfile(item.id);
            navigation.navigate('ProfileDetail', { profile: fullProfile || item });
          } catch (err) {
            navigation.navigate('ProfileDetail', { profile: item });
          } finally {
            setFetchingDetailId(null);
          }
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isUnlocked ? `Admirer ${item.name}` : 'Locked Secret Admirer'}
      >
        {fetchingDetailId === item.id && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        <Image source={{ uri: item.photos?.[0] }} style={styles.cardImage} contentFit="cover" />

        {/* Status Pill Badge Top Right */}
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{isUnlocked ? 'ACTIVE' : 'NEW LIKE'}</Text>
        </View>

        {/* Lock Overlay for Blurred Cards */}
        {!isUnlocked && (
          <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFillObject}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={22} color="#FFF" />
            </View>
            <View style={styles.skeletonTextBarWide} />
            <View style={styles.skeletonTextBarShort} />

            <View style={styles.hiddenEyeBtn}>
              <Ionicons name="eye-off-outline" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </BlurView>
        )}

        {/* Gradient Info Footer for Unlocked Cards */}
        {isUnlocked && (
          <LinearGradient
            colors={['transparent', 'rgba(18,5,26,0.7)', 'rgba(18,5,26,0.98)']}
            style={styles.cardGradientFooter}
          >
            <Text style={styles.admirerName}>{item.name}, {item.age}</Text>
            <Text style={styles.admirerTitle} numberOfLines={1}>{item.occupation || 'Soulmate'}</Text>

            <TouchableOpacity
              style={styles.matchActionBtn}
              onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Match with ${item.name}`}
            >
              <LinearGradient
                colors={['#E8628F', '#C53D6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.matchActionGradient}
              >
                <Ionicons name="heart" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.matchActionText}>Match</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ResponsiveContainer>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <Text style={styles.brandWordmark}>Lovly</Text>
        <Image
          source={{ uri: profile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
          style={styles.headerAvatar}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.serifTitle}>Secret Admirers</Text>
          <Text style={styles.serifSubtitle}>
            Discover the hearts that skip a beat when you're around. A curated collection of your most silent devotees.
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabBarWrap}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'received' && styles.tabItemActive]}
            onPress={() => setActiveTab('received')}
            accessible={true}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Likes You ({likes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'sent' && styles.tabItemActive]}
            onPress={() => setActiveTab('sent')}
            accessible={true}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Sent ({sentLikes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid of Admirers */}
        {loading ? (
          <View style={styles.gridContainer}>
            <Skeleton width={cardWidth} height={cardHeight} borderRadius={Radius['2xl']} />
            <Skeleton width={cardWidth} height={cardHeight} borderRadius={Radius['2xl']} />
          </View>
        ) : (
          <FlatList
            data={activeTab === 'received' ? likes : sentLikes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            renderItem={renderAdmirerCard}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContainer}
          />
        )}

        {/* ── Unmask Your Admirers Hero Upgrade Card ──────────────────── */}
        {activeTab === 'received' && !isPremium && (
          <View style={styles.unmaskCardWrap}>
            <LinearGradient
              colors={['#271236', '#1A0826', '#12051A']}
              style={styles.unmaskCardGradient}
            >
              <View style={styles.sparkIconGlow}>
                <Ionicons name="sparkles" size={24} color={Colors.gold} />
              </View>

              <Text style={styles.unmaskTitle}>Unmask Your Admirers</Text>
              <Text style={styles.unmaskBody}>
                There are 12 more people who have already said 'Yes' to you. See them all today.
              </Text>

              <TouchableOpacity
                style={styles.revealAllBtn}
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.9}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reveal All Admirers"
              >
                <LinearGradient
                  colors={['#E8628F', '#C53D6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.revealAllBtnGradient}
                >
                  <Text style={styles.revealAllBtnText}>REVEAL ALL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
      </ResponsiveContainer>
    </View>
  );
}

// Fallback Admirers Data
const MOCK_ADMIRERS = [
  {
    id: 'adm-1',
    name: 'Julian',
    age: 29,
    occupation: 'Architect',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
  },
  {
    id: 'adm-2',
    name: 'Sienna',
    age: 27,
    occupation: 'Curator',
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'],
  },
  {
    id: 'adm-3',
    name: 'Chloe',
    age: 26,
    occupation: 'Fashion Stylist',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80'],
  },
  {
    id: 'adm-4',
    name: 'Marc',
    age: 31,
    occupation: 'Creative Director',
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80'],
  },
];

const createStyles = (cardWidth: number, cardHeight: number, Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#12051A' },
    headerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: 12,
    },
    brandWordmark: {
      fontSize: 28,
      fontWeight: '800',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    headerAvatar: { width: 34, height: 34, borderRadius: 17 },

    scrollContent: { paddingBottom: 120 },

    titleSection: { paddingHorizontal: Spacing.xl, marginTop: 6, marginBottom: 16 },
    serifTitle: {
      fontSize: 28,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    serifSubtitle: {
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: 6,
      lineHeight: 18,
    },

    tabBarWrap: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: Radius.full,
      padding: 4,
      marginHorizontal: Spacing.xl,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    tabItem: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: Radius.full,
    },
    tabItemActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
    tabTextActive: { color: '#FFF' },

    gridContainer: { paddingHorizontal: Spacing.xl },
    columnWrapper: { justifyContent: 'space-between', marginBottom: cardMargin },

    admirerCard: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: Radius['2xl'],
      overflow: 'hidden',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      ...Shadow.md,
    },
    cardImage: { width: '100%', height: '100%' },
    statusPill: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(241,213,165,0.85)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.full,
      zIndex: 10,
    },
    statusPillText: { fontSize: 9, fontWeight: '800', color: '#14051A' },

    lockIconCircle: {
      position: 'absolute',
      top: '35%',
      alignSelf: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    skeletonTextBarWide: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      width: '60%',
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    skeletonTextBarShort: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      width: '40%',
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    hiddenEyeBtn: {
      position: 'absolute',
      bottom: 12,
      alignSelf: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },

    cardGradientFooter: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: 14,
    },
    admirerName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    admirerTitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    matchActionBtn: { marginTop: 10, borderRadius: Radius.full, overflow: 'hidden' },
    matchActionGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
    },
    matchActionText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

    unmaskCardWrap: {
      marginHorizontal: Spacing.xl,
      marginTop: 24,
      borderRadius: Radius['3xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(233,75,115,0.3)',
      ...Shadow.lg,
    },
    unmaskCardGradient: { padding: 24, alignItems: 'center' },
    sparkIconGlow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(241,213,165,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    unmaskTitle: {
      fontSize: 22,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    unmaskBody: {
      fontSize: 12,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    revealAllBtn: { marginTop: 18, alignSelf: 'center' },
    revealAllBtnGradient: {
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: Radius.full,
    },
    revealAllBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 1 },

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(18,5,26,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    },
  });
