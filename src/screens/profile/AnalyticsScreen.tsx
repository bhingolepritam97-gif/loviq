import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer } from '../../core/responsive';

// Mock Data
const WEEKLY_DATA = [
  { day: 'Mon', views: 40, likes: 12 },
  { day: 'Tue', views: 30, likes: 8 },
  { day: 'Wed', views: 65, likes: 24 },
  { day: 'Thu', views: 45, likes: 15 },
  { day: 'Fri', views: 90, likes: 35 },
  { day: 'Sat', views: 120, likes: 48 },
  { day: 'Sun', views: 100, likes: 40 },
];
const MAX_VIEWS = Math.max(...WEEKLY_DATA.map(d => d.views));

const SWIPE_RATIO = { right: 35, left: 65 };

const PHOTO_RANKING = [
  { id: 1, rank: 1, uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300', score: '92%' },
  { id: 2, rank: 2, uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300', score: '85%' },
  { id: 3, rank: 3, uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', score: '78%' },
];

export default function AnalyticsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors, width);
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  
  // For dev testing, you can force this to true/false to see the paywall
  const isPremium = profile?.isPremium || false;

  const barAnim = useRef(new Animated.Value(0)).current;

  const userPhotos = profile?.photos || [];
  const photoRanking = [
    { id: 1, rank: 1, uri: userPhotos[0] || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300', score: '92%' },
    { id: 2, rank: 2, uri: userPhotos[1] || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300', score: '85%' },
    { id: 3, rank: 3, uri: userPhotos[2] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', score: '78%' },
  ];

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <ResponsiveContainer safeArea={false}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Your Performance</Text>
        <Text style={styles.pageSubtitle}>See how your profile is doing this week.</Text>

        {/* WEEKLY BAR CHART */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Views & Likes</Text>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Views</Text>
              <View style={[styles.legendDot, { backgroundColor: '#FFB6C1', marginLeft: 12 }]} />
              <Text style={styles.legendText}>Likes</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {WEEKLY_DATA.map((item, index) => {
              const viewHeight = barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${(item.views / MAX_VIEWS) * 100}%`]
              });
              const likeHeight = barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${(item.likes / MAX_VIEWS) * 100}%`]
              });

              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.bars}>
                    {/* Background track (optional) */}
                    <View style={styles.barTrack} />
                    <Animated.View style={[styles.bar, { height: viewHeight, backgroundColor: Colors.primary }]} />
                    <Animated.View style={[styles.bar, styles.likeBar, { height: likeHeight, backgroundColor: '#FFB6C1' }]} />
                  </View>
                  <Text style={styles.dayText}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* SWIPE RATIO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Swipe Ratio</Text>
          <Text style={styles.cardDesc}>You're quite selective! You swipe right {SWIPE_RATIO.right}% of the time.</Text>
          
          <View style={styles.ratioBarContainer}>
            <View style={[styles.ratioBarRight, { width: `${SWIPE_RATIO.right}%` }]} />
            <View style={[styles.ratioBarLeft, { width: `${SWIPE_RATIO.left}%` }]} />
          </View>
          <View style={styles.ratioLabels}>
            <Text style={styles.ratioLabelRight}>❤️ Right ({SWIPE_RATIO.right}%)</Text>
            <Text style={styles.ratioLabelLeft}>Nope ({SWIPE_RATIO.left}%) ✕</Text>
          </View>
        </View>

        {/* SMART INSIGHTS */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Smart Insights</Text>
        <View style={styles.insightsGrid}>
          <View style={styles.insightBox}>
            <Text style={styles.insightEmoji}>🔥</Text>
            <Text style={styles.insightTitle}>Peak Hours</Text>
            <Text style={styles.insightDesc}>You get 3x more likes on Sunday evenings.</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightEmoji}>🎯</Text>
            <Text style={styles.insightTitle}>Audience</Text>
            <Text style={styles.insightDesc}>Most likes come from people aged 24-28.</Text>
          </View>
        </View>

        {/* PHOTO A/B TESTING */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Photo Effectiveness</Text>
        <Text style={styles.cardDesc}>Based on when users swipe right on your profile.</Text>
        <View style={styles.photoGrid}>
          {photoRanking.map((photo, index) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{photo.rank}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>👍 {photo.score}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* PREMIUM TEASER OVERLAY */}
      {!isPremium && (
        <View style={styles.paywallOverlay}>
          {Platform.OS === 'ios' ? (
            // A semi-transparent fallback if BlurView isn't installed, or use standard linear gradient
            <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.95)', '#ffffff']} style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.95)', '#ffffff']} style={StyleSheet.absoluteFill} />
          )}
          
          <View style={styles.paywallContent}>
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={32} color={Colors.white} />
            </View>
            <Text style={styles.paywallTitle}>Unlock Full Insights</Text>
            <Text style={styles.paywallDesc}>See exactly who is viewing your profile, optimize your photos, and master the algorithm with Lovly Gold.</Text>
            
            <TouchableOpacity 
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Premium')}
              accessible={true} accessibilityLabel="Upgrade to Gold" accessibilityRole="button"
            >
              <LinearGradient
                colors={Gradients.premium.colors}
                start={Gradients.premium.start}
                end={Gradients.premium.end}
                style={styles.upgradeBtnGradient}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Gold ✨</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (Colors, width) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  pageSubtitle: { fontSize: 16, color: Colors.textMuted, marginBottom: Spacing.xl },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 20 },
  
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  chartContainer: { height: 160, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: Spacing.md },
  barGroup: { alignItems: 'center', flex: 1 },
  bars: { height: 130, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
  barTrack: { position: 'absolute', bottom: 0, width: 24, height: '100%', backgroundColor: Colors.background, borderRadius: 12 },
  bar: { width: 12, borderRadius: 6 },
  likeBar: { position: 'absolute', width: 12, zIndex: 2, borderRadius: 6 },
  dayText: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm, fontWeight: '600' },

  ratioBarContainer: { height: 16, flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginVertical: Spacing.md },
  ratioBarRight: { height: '100%', backgroundColor: Colors.primary },
  ratioBarLeft: { height: '100%', backgroundColor: Colors.border },
  ratioLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  ratioLabelRight: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  ratioLabelLeft: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  insightsGrid: { flexDirection: 'row', gap: Spacing.md },
  insightBox: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  insightEmoji: { fontSize: 28, marginBottom: 8 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  insightDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

  photoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  photoCard: { width: '31%', aspectRatio: 3/4, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.border },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  rankBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.surface, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...Shadow.sm },
  rankText: { fontSize: 12, fontWeight: '800', color: Colors.text },
  scoreBadge: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, borderRadius: 4, alignItems: 'center' },
  scoreText: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  paywallOverlay: { position: 'absolute', top: 180, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  paywallContent: { padding: Spacing.xl, alignItems: 'center', marginTop: 100 },
  lockIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, ...Shadow.md },
  paywallTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  paywallDesc: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  
  upgradeBtn: { alignSelf: 'stretch', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  upgradeBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
});
