import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - Spacing.lg * 1.5;

const VIBES = [
  { id: 'verified',  label: 'Verified Only', emoji: '🌟', color: ['#818cf8', '#4f46e5'], desc: 'Selfie verified profiles' },
  { id: 'active',    label: 'Active Life', emoji: '🏃‍♂️', color: ['#60a5fa', '#2563eb'], desc: 'Hiking, gym & yoga' },
  { id: 'foodie',    label: 'Foodies', emoji: '🍜', color: ['#fbbf24', '#d97706'], desc: 'Coffee, brunch & dining' },
  { id: 'creative',  label: 'Creatives', emoji: '🎨', color: ['#f472b6', '#db2777'], desc: 'Art, music & design' },
  { id: 'nightlife', label: 'Night Owls', emoji: '🍸', color: ['#a78bfa', '#7c3aed'], desc: 'Drinks, pubs & dancing' },
  { id: 'chill',     label: 'Chill Vibes', emoji: '☕', color: ['#34d399', '#059669'], desc: 'Gaming & movie chats' },
];

export default function ExploreScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPicks = async () => {
      if (!user || !profile) return;
      try {
        const response = await apiClient('/deck/top-picks', { cache: true, ttl: 300000 });
        if (response.success && response.candidates) {
          // Normalize photos array for frontend components
          const picks = response.candidates.map(c => ({
            ...c,
            photos: Array.isArray(c.photos) 
              ? c.photos.map(p => (typeof p === 'string' ? p : p.url))
              : []
          }));
          setTopPicks(picks);
        }
      } catch (err) {
        console.error('Error fetching top picks from Postgres:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopPicks();
  }, [user, profile]);

  const isPremium = profile?.isPremium;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover Pune profiles by vibes and curated matches</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Passport Mode Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="airplane" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Passport Mode</Text>
          </View>
          <TouchableOpacity 
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Passport Mode: Swipe around the world"
            style={styles.passportCard}
            activeOpacity={0.9}
            onPress={() => isPremium 
              ? Alert.alert('Passport Mode', 'Choose a city to swipe in from anywhere in the world. This feature is coming in the next update!', [{text: 'OK'}])
              : navigation.navigate('Premium')}
          >
            <LinearGradient
              colors={['rgba(25,30,50,0.85)', 'rgba(10,15,30,0.95)']}
              style={styles.passportGradient}
            >
              <View style={styles.passportContent}>
                <View>
                  <Text style={styles.passportTitle}>Swipe around the world</Text>
                  <Text style={styles.passportSubtitle}>Change your location to any city</Text>
                </View>
                {!isPremium && <View style={styles.lockBadge}><Ionicons name="lock-closed" size={14} color="#fff" /></View>}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Find by Vibe Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="compass" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Find by Vibe</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Filter Discover feed matching your current mood</Text>
          
          <View style={styles.vibesGrid}>
            {VIBES.map((vibe) => (
              <TouchableOpacity
                key={vibe.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Find by Vibe: ${vibe.label}`}
                style={styles.vibeCard}
                activeOpacity={0.85}
                onPress={() => {
                  // Navigate to Discover tab passing the filter parameter
                  navigation.navigate('Discover', { filterVibe: vibe.id });
                }}
              >
                <LinearGradient
                  colors={vibe.color as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.vibeGradient}
                >
                  <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                  <View>
                    <Text style={styles.vibeLabel}>{vibe.label}</Text>
                    <Text style={styles.vibeDesc}>{vibe.desc}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Picks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color={Colors.gold} />
            <Text style={styles.sectionTitle}>Top Picks</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Hand-selected curated profiles for you in Pune</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : topPicks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={48} color={Colors.border} style={{ marginBottom: Spacing.sm }} />
              <Text style={styles.emptyTitle}>Curating Top Picks...</Text>
              <Text style={styles.emptySubtitle}>We are curated hand-selected compatibility profiles. Check back soon!</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {topPicks.map((pick, index) => (
                <TouchableOpacity 
                  key={pick.id} 
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Top Pick: ${pick.name}`}
                  style={styles.pickCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!isPremium && index > 1) {
                      navigation.navigate('Premium');
                    } else {
                      navigation.navigate('ProfileDetail', { profile: pick });
                    }
                  }}
                >
                  <Image 
                    source={{ uri: pick.photos?.[0] }} 
                    style={styles.pickImage} 
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                  
                  {(!isPremium && index > 1) && (
                    <BlurView intensity={70} tint="light" style={styles.blurOverlay} />
                  )}

                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.pickGradient}>
                    <View style={styles.pickInfo}>
                      <Text style={styles.pickName} numberOfLines={1}>{pick.name}, {pick.age}</Text>
                      {(!isPremium && index > 1) && <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginLeft: 4 }} />}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xs },
  title: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  scrollContent: { paddingBottom: 100 },
  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sectionSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm },
  
  passportCard: { width: '100%', height: 110, borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.xs, ...Shadow.md },
  passportGradient: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  passportContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passportTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  passportSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  lockBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  
  vibesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.xs },
  vibeCard: { width: width / 2 - Spacing.xl - Spacing.xs, height: 115, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
  vibeGradient: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  vibeEmoji: { fontSize: 24 },
  vibeLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },
  vibeDesc: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: Spacing.xs },
  pickCard: { width: cardWidth, height: cardWidth * 1.35, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.lg, ...Shadow.sm },
  pickImage: { width: '100%', height: '100%' },
  blurOverlay: { ...StyleSheet.absoluteFillObject },
  pickGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', justifyContent: 'flex-end', padding: Spacing.md },
  pickInfo: { flexDirection: 'row', alignItems: 'center' },
  pickName: { fontSize: 14, fontWeight: '700', color: Colors.white, flex: 1 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
