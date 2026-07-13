import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function MyProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { profile } = useAuth();

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 50; // Base score for onboarding
    if (profile?.photos && profile.photos.length >= 2) score += 20;
    else if (profile?.photos && profile.photos.length === 1) score += 5;
    if (profile?.bio) score += 15;
    if (profile?.intent) score += 10;
    if (profile?.interests && profile.interests.length > 0) score += 5;
    return Math.min(score, 100);
  };
  const completionPct = calculateCompletion();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ManagePhotos')} style={[styles.imageWrap, !profile?.photos?.[0] && { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            {profile?.photos?.[0] ? (
              <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
            ) : (
              <Text style={{ fontSize: 48, color: Colors.white, fontWeight: '800' }}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>
            {profile?.name || 'User'}{profile?.age ? `, ${profile.age}` : ''}
          </Text>
          <Text style={styles.jobText}>📍 {profile?.location?.cityName || 'Earth'}</Text>
          
          {/* Profile Completion Bar */}
          <TouchableOpacity 
            style={styles.completionContainer} 
            activeOpacity={0.7}
            onPress={() => completionPct < 100 ? navigation.navigate('EditProfile') : null}
          >
            <View style={styles.completionHeader}>
              <Text style={styles.completionText}>
                Profile is {completionPct}% complete
              </Text>
              {completionPct < 100 && (
                <Text style={styles.completionAction}>Complete it →</Text>
              )}
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionLabel}>Edit Info</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Preferences')}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* View Insights Button */}
        <TouchableOpacity 
          style={[styles.actionButton, { width: '100%', height: 60, flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl, borderColor: Colors.border, borderWidth: 1 }]} 
          onPress={() => navigation.navigate('Analytics')}
        >
          <Text style={{ fontSize: 20 }}>📈</Text>
          <Text style={[styles.actionLabel, { fontSize: 16, color: Colors.text, fontWeight: '700' }]}>View Profile Insights</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} style={{ position: 'absolute', right: Spacing.lg }} />
        </TouchableOpacity>

        {/* Premium Promo Card */}
        <TouchableOpacity style={styles.promoCard} onPress={() => navigation.navigate('Premium')}>
          <LinearGradient
            colors={Gradients.premium.colors}
            start={Gradients.premium.start}
            end={Gradients.premium.end}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Upgrade to Vela Gold</Text>
                <Text style={styles.promoSubtitle}>Get unlimited likes, rewind swipes, & more features!</Text>
              </View>
              <Text style={styles.promoArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Verification Card (if not verified) */}
        {!profile?.isVerified && (
          <TouchableOpacity style={[styles.safetyCard, { marginBottom: Spacing.md, borderColor: Colors.primary }]} onPress={() => navigation.navigate('PhotoVerification')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
              <Text style={{ fontSize: 20 }}>🛡️</Text>
              <Text style={[styles.safetyTitle, { marginBottom: 0 }]}>Get Verified</Text>
            </View>
            <Text style={styles.safetyText}>Prove it's you to get a blue checkmark and more matches!</Text>
          </TouchableOpacity>
        )}

        {/* App tips or safety cards */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety Tips 🛡️</Text>
          <Text style={styles.safetyText}>Learn how to keep your matches fun and safe.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, alignItems: 'center', paddingBottom: 100 },
  profileCard: { alignItems: 'center', marginBottom: Spacing.xl },
  imageWrap: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', borderWidth: 4, borderColor: Colors.white, ...Shadow.md, marginBottom: Spacing.md },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  name: { fontSize: 28, fontWeight: '800', color: Colors.text },
  jobText: { fontSize: 16, color: Colors.textMuted, marginTop: Spacing.xs },
  
  editBadge: { position: 'absolute', bottom: 4, right: 12, backgroundColor: Colors.surface, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  editBadgeIcon: { fontSize: 14 },
  
  completionContainer: { width: '100%', marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  completionText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  completionAction: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  progressBarBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: Spacing.xl, marginBottom: Spacing['2xl'] },
  actionButton: { alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, width: 84, height: 84, justifyContent: 'center', ...Shadow.sm },
  editButton: { borderColor: Colors.primary, borderWidth: 1.5 },
  actionIcon: { fontSize: 24, marginBottom: Spacing.xs },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  promoCard: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.xl, ...Shadow.md },
  promoGradient: { padding: Spacing.xl },
  promoContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  promoEmoji: { fontSize: 32 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  promoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 18 },
  promoArrow: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  safetyCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  safetyTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  safetyText: { fontSize: 14, color: Colors.textMuted },
});
