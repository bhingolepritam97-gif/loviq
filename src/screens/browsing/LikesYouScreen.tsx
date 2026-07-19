import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserProfile } from '../../services/UserService';
import { Skeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardMargin = Spacing.sm;
const cardWidth = (width - Spacing.lg * 2 - cardMargin * (numColumns - 1)) / numColumns;
const cardHeight = cardWidth * 1.3;

export default function LikesYouScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [likes, setLikes] = useState([]);
  const [sentLikes, setSentLikes] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingDetailId, setFetchingDetailId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchSwipesData = async () => {
    if (!user) return;
    setError(null);
    try {
      // 1. Fetch Received Likes (other users who liked me) from backend
      const resReceived = await apiClient('/swipes/likes', { cache: true, ttl: 300000 });
      if (resReceived.success) {
        const likers = (resReceived.likes || []).map(like => {
          let age = 28; // default fallback
          if (like.user.birthdate) {
            const birth = new Date(like.user.birthdate);
            age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          }
          return {
            id: like.user.id,
            name: like.user.name || 'Secret Admirer',
            age,
            photos: like.user.photos && like.user.photos.length > 0 ? [like.user.photos[0].url] : [],
            isSuperLike: like.direction === 'superlike',
            message: like.commentText || null,
            cityName: like.user.cityName || ''
          };
        });
        setLikes(likers);
      }

      // 2. Fetch Sent Likes (users I liked) from backend
      const resSent = await apiClient('/swipes/sent', { cache: true, ttl: 300000 });
      if (resSent.success) {
        const liked = (resSent.likes || []).map(like => {
          let age = 28; // default fallback
          if (like.user.birthdate) {
            const birth = new Date(like.user.birthdate);
            age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          }
          return {
            id: like.user.id,
            name: like.user.name || '',
            age,
            photos: like.user.photos && like.user.photos.length > 0 ? [like.user.photos[0].url] : [],
            isSuperLike: like.direction === 'superlike',
            message: like.commentText || null,
            cityName: like.user.cityName || ''
          };
        });
        setSentLikes(liked);
      }
    } catch (err) {
      console.error('Error fetching swipes:', err);
      setError('Failed to load likes. Please try again.');
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

  const renderLiker = ({ item }) => {
    return (
      <TouchableOpacity 
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Profile of ${showUnblurred ? item.name : 'Secret Admirer'}`}
        style={[styles.card, item.isSuperLike && styles.superLikeCard]} 
        activeOpacity={0.8}
        onPress={async () => {
          if (!showUnblurred) {
            navigation.navigate('Premium');
            return;
          }
          if (fetchingDetailId) return;
          setFetchingDetailId(item.id);
          try {
            const fullProfile = await fetchUserProfile(item.id);
            if (fullProfile) {
              navigation.navigate('ProfileDetail', { profile: fullProfile });
            } else {
              navigation.navigate('ProfileDetail', { profile: item });
            }
          } catch (err) {
            navigation.navigate('ProfileDetail', { profile: item });
          } finally {
            setFetchingDetailId(null);
          }
        }}
      >
        {fetchingDetailId === item.id && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        {item.photos?.[0] ? (
          <Image 
            source={{ uri: item.photos[0] }} 
            style={styles.image} 
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={[styles.image, { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.textMuted }}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
        
        {!showUnblurred && (
          <BlurView intensity={80} tint="dark" style={styles.blurOverlay} />
        )}
        
        {item.isSuperLike && (
          <View style={styles.superLikeBadge}>
            <Ionicons name="star" size={12} color={Colors.white} />
            <Text style={styles.superLikeBadgeText}>SUPER LIKED</Text>
          </View>
        )}

        {showUnblurred && item.message && (
          <View style={styles.messageBadge}>
            <Ionicons name="chatbubble" size={12} color={Colors.white} />
            <Text style={styles.messageBadgeText} numberOfLines={2}>"{item.message}"</Text>
          </View>
        )}

        <LinearGradient colors={Gradients.dark.colors as any} style={styles.gradient}>
          <View style={styles.info}>
            <Text style={styles.name}>{showUnblurred ? item.name : 'Secret Admirer'}</Text>
            {showUnblurred ? (
              <Text style={styles.age}>{item.age}</Text>
            ) : (
              <Text style={styles.teaserText}>
                {item.age ? `Age ${item.age}` : ''}
                {item.location?.cityName ? ` · ${item.location.cityName}` : item.cityName ? ` · ${item.cityName}` : ''}
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Likes</Text>
        {activeTab === 'received' && !isPremium && (
          <Text style={styles.headerSubtitle}>Upgrade to Gold to see who liked you</Text>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Likes You tab. ${likes.length} profiles`}
          style={[styles.tabButton, activeTab === 'received' && styles.tabButtonActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'received' && styles.tabButtonTextActive]}>
            Likes You ({likes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Sent tab. ${sentLikes.length} profiles`}
          style={[styles.tabButton, activeTab === 'sent' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'sent' && styles.tabButtonTextActive]}>
            Sent ({sentLikes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.list}>
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={item => item.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
            renderItem={() => (
              <Skeleton width={cardWidth} height={cardHeight} borderRadius={Radius.lg} />
            )}
          />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={64} color={Colors.error} />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSwipesData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (activeTab === 'received' ? likes.length : sentLikes.length) === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'received' ? 'No likes yet' : 'No likes sent yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'received' 
              ? "Keep swiping! When someone likes you, they'll appear here." 
              : "Swipe right on profiles in Discover to show your interest!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'received' ? likes : sentLikes}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          renderItem={renderLiker}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          getItemLayout={(data, index) => ({
            length: cardHeight + Spacing.md,
            offset: (cardHeight + Spacing.md) * Math.floor(index / numColumns),
            index,
          })}
        />
      )}

      {activeTab === 'received' && !isPremium && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity 
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Gold to See Who Likes You"
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Premium')}
          >
            <LinearGradient
              colors={Gradients.gold.colors}
              start={Gradients.gold.start}
              end={Gradients.gold.end}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeText}>See Who Likes You</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabButtonTextActive: {
    color: Colors.white,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.md },
  retryButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.full },
  retryButtonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: Spacing.md },
  card: { width: cardWidth, height: cardWidth * 1.3, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, borderWidth: 2, borderColor: 'transparent' },
  superLikeCard: { borderColor: '#3b82f6', borderWidth: 2 },
  image: { width: '100%', height: '100%' },
  blurOverlay: { ...StyleSheet.absoluteFillObject },
  superLikeBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2, zIndex: 10 },
  superLikeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  messageBadge: { position: 'absolute', top: '40%', left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'flex-start', gap: 4, zIndex: 10 },
  messageBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600', flex: 1, fontStyle: 'italic' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: Spacing.md },
  info: { flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.white },
  age: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  teaserText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600', marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, backgroundColor: 'rgba(10,15,30,0.92)' },
  upgradeBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  upgradeGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  upgradeText: { fontSize: 16, fontWeight: '700', color: Colors.surface, textTransform: 'uppercase', letterSpacing: 0.5 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,30,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20
  },
});
