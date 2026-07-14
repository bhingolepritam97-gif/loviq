import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getPotentialMatches } from '../../services/DiscoverService';

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - Spacing.lg * 1.5;

export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPicks = async () => {
      if (!user || !profile) return;
      try {
        const picks = await getPotentialMatches(user.uid, profile, 100);
        // limit to 10 for Top Picks grid curation
        setTopPicks(picks.slice(0, 10));
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
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Passport Mode Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="airplane" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Passport Mode</Text>
          </View>
          <TouchableOpacity 
            style={styles.passportCard}
            activeOpacity={0.9}
            onPress={() => isPremium 
              ? Alert.alert('Passport Mode', 'Choose a city to swipe in from anywhere in the world. This feature is coming in the next update!', [{text: 'OK'}])
              : navigation.navigate('Profile', { screen: 'Premium' })}
          >
            <LinearGradient
              colors={['rgba(25,30,50,0.8)', 'rgba(10,15,30,0.9)']}
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

        {/* Top Picks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={20} color={Colors.gold} />
            <Text style={styles.sectionTitle}>Top Picks</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Curated just for you</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={styles.grid}>
              {topPicks.map((pick, index) => (
                <TouchableOpacity 
                  key={pick.id} 
                  style={styles.pickCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ProfileDetail', { profile: pick })}
                >
                  <Image source={{ uri: pick.photos?.[0] }} style={styles.pickImage} />
                  
                  {(!isPremium && index > 1) && (
                    <BlurView intensity={70} tint="light" style={styles.blurOverlay} />
                  )}

                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.pickGradient}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  title: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  scrollContent: { paddingBottom: 100 },
  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sectionSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.md },
  
  passportCard: { width: '100%', height: 120, borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.sm, ...Shadow.md },
  passportGradient: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  passportContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passportTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  passportSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  lockBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: Spacing.md },
  pickCard: { width: cardWidth, height: cardWidth * 1.4, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.lg, ...Shadow.sm },
  pickImage: { width: '100%', height: '100%' },
  blurOverlay: { ...StyleSheet.absoluteFillObject },
  pickGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: Spacing.md },
  pickInfo: { flexDirection: 'row', alignItems: 'center' },
  pickName: { fontSize: 16, fontWeight: '700', color: Colors.white, flex: 1 },
});
