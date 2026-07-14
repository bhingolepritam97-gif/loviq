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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!user) return;
      try {
        // Find users who liked or super_liked the current user
        const swipesRef = collection(db, 'swipes');
        const q = query(swipesRef, where('to', '==', user.uid), where('action', 'in', ['like', 'super_like']));
        const querySnapshot = await getDocs(q);
        
        const likers = [];
        for (const swipeDoc of querySnapshot.docs) {
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
        
        // Remove duplicates just in case
        const uniqueLikers = Array.from(new Map(likers.map(item => [item.id, item])).values());
        setLikes(uniqueLikers);
      } catch (err) {
        console.error('Error fetching likes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLikes();
  }, [user]);

  const isPremium = profile?.isPremium;

  const renderLiker = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.card, item.isSuperLike && styles.superLikeCard]} 
        activeOpacity={0.8}
        onPress={() => {
          if (isPremium) {
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
        
        {!isPremium && (
          <BlurView intensity={80} tint="light" style={styles.blurOverlay} />
        )}
        
        {item.isSuperLike && (
          <View style={styles.superLikeBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.superLikeBadgeText}>SUPER LIKED YOU</Text>
          </View>
        )}

        {isPremium && item.message && (
          <View style={styles.messageBadge}>
            <Ionicons name="chatbubble" size={12} color="#fff" />
            <Text style={styles.messageBadgeText} numberOfLines={2}>"{item.message}"</Text>
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
          <View style={styles.info}>
            <Text style={styles.name}>{isPremium ? item.name : 'Secret Admirer'}</Text>
            {isPremium ? (
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
        <Text style={styles.headerTitle}>{likes.length} Likes</Text>
        <Text style={styles.headerSubtitle}>Upgrade to Gold to see who liked you</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : likes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptySubtitle}>Keep swiping! When someone likes you back, they'll appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={item => item.id}
          renderItem={renderLiker}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!isPremium && (
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
  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
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
