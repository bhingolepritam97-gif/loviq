import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardMargin = Spacing.sm;
const cardWidth = (width - Spacing.lg * 2 - cardMargin * (numColumns - 1)) / numColumns;

export default function LikesYouScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [likes, setLikes] = useState([]);
  const [sentLikes, setSentLikes] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwipesData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const swipesRef = collection(db, 'swipes');
        
        // 1. Fetch Received Likes (other users who liked me)
        const qReceived = query(swipesRef, where('to', '==', user.uid), where('action', 'in', ['like', 'super_like']));
        const snapshotReceived = await getDocs(qReceived);
        
        const likers = [];
        for (const swipeDoc of snapshotReceived.docs) {
          const swipeData = swipeDoc.data();
          const userSnap = await getDoc(doc(db, 'profiles', swipeData.from));
          if (userSnap.exists()) {
            likers.push({ 
              id: userSnap.id, 
              ...userSnap.data(),
              isSuperLike: swipeData.action === 'super_like',
              message: swipeData.message || null
            });
          }
        }
        const uniqueLikers = Array.from(new Map(likers.map(item => [item.id, item])).values());
        setLikes(uniqueLikers);

        // 2. Fetch Sent Likes (users I liked)
        const qSent = query(swipesRef, where('from', '==', user.uid), where('action', 'in', ['like', 'super_like']));
        const snapshotSent = await getDocs(qSent);
        
        const liked = [];
        for (const swipeDoc of snapshotSent.docs) {
          const swipeData = swipeDoc.data();
          const userSnap = await getDoc(doc(db, 'profiles', swipeData.to));
          if (userSnap.exists()) {
            liked.push({
              id: userSnap.id,
              ...userSnap.data(),
              isSuperLike: swipeData.action === 'super_like',
              message: swipeData.message || null
            });
          }
        }
        const uniqueLiked = Array.from(new Map(liked.map(item => [item.id, item])).values());
        setSentLikes(uniqueLiked);
      } catch (err) {
        console.error('Error fetching swipes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSwipesData();
  }, [user]);

  const isPremium = profile?.isPremium;
  const showUnblurred = activeTab === 'sent' || isPremium;

  const renderLiker = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.card, item.isSuperLike && styles.superLikeCard]} 
        activeOpacity={0.8}
        onPress={() => {
          if (showUnblurred) {
            navigation.navigate('ProfileDetail', { profile: item });
          } else {
            navigation.navigate('Profile', { screen: 'Premium' });
          }
        }}
      >
        {item.photos?.[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.textMuted }}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
        
        {!showUnblurred && (
          <BlurView intensity={80} tint="light" style={styles.blurOverlay} />
        )}
        
        {item.isSuperLike && (
          <View style={styles.superLikeBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.superLikeBadgeText}>SUPER LIKED</Text>
          </View>
        )}

        {showUnblurred && item.message && (
          <View style={styles.messageBadge}>
            <Ionicons name="chatbubble" size={12} color="#fff" />
            <Text style={styles.messageBadgeText} numberOfLines={2}>"{item.message}"</Text>
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
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
          style={[styles.tabButton, activeTab === 'received' && styles.tabButtonActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'received' && styles.tabButtonTextActive]}>
            Likes You ({likes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'sent' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'sent' && styles.tabButtonTextActive]}>
            Sent ({sentLikes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
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
          renderItem={renderLiker}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'received' && !isPremium && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity 
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Profile', { screen: 'Premium' })}
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

const styles = StyleSheet.create({
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
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.85)' },
  upgradeBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  upgradeGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  upgradeText: { fontSize: 16, fontWeight: '700', color: Colors.surface, textTransform: 'uppercase', letterSpacing: 0.5 },
});
