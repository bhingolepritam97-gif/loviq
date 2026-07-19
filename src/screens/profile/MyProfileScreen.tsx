import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProfileScoreCard from '../../components/ProfileScoreCard';

export default function MyProfileScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { profile } = useAuth();

  const [boostSeconds, setBoostSeconds] = useState(0);

  useEffect(() => {
    if (boostSeconds <= 0) return;
    const interval = setInterval(() => {
      setBoostSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [boostSeconds]);

  const activateBoost = () => {
    if (boostSeconds > 0) return;
    setBoostSeconds(30 * 60); // 30 minutes
    Alert.alert('Boost Activated! 🚀', 'Your profile is now receiving extra visibility for the next 30 minutes.');
  };

  const formatBoostTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fallback demo photos for Life Moments if profile has only 1 photo
  const lifeMoments = profile?.photos && profile.photos.length > 1 
    ? profile.photos.slice(1) 
    : [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600'
      ];

  const demoPrompts = profile?.user_prompt_answers && profile.user_prompt_answers.length > 0
    ? profile.user_prompt_answers
    : [
        { promptQuestion: 'The way to my heart is...', answerText: 'Through curated playlists and shared silence at bookstores.' },
        { promptQuestion: 'My simple pleasures...', answerText: 'The smell of fresh jasmine and the first espresso on a Saturday morning.' }
      ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Text style={styles.barBrand}>Lovly</Text>
        <TouchableOpacity 
          accessible={true} 
          accessibilityRole="button" 
          accessibilityLabel="Go to settings" 
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsIconBtn}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Large Hero Asymmetric Photo */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ManagePhotos')}
          style={styles.heroWrap}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Manage Profile Photos"
        >
          {profile?.photos?.[0] ? (
            <Image source={{ uri: profile.photos[0] }} style={styles.heroAvatar as any} />
          ) : (
            <View style={styles.heroAvatarFallback}>
              <Text style={styles.fallbackLetter}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Profile Info block */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile?.name || 'Elena'}{profile?.age ? `, ${profile.age}` : ''}
            </Text>
            {profile?.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#E8628F" style={{ marginLeft: Spacing.xs }} />
            )}
          </View>
          <Text style={styles.jobText}>{profile?.job || 'Interior Designer'}</Text>
          {profile?.cityName && (
            <Text style={styles.locationText}>📍 {profile.cityName}</Text>
          )}
          
          {/* Preview my profile */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileDetail', { profile: { ...profile, id: profile?.id || profile?.uid } })}
            style={styles.previewButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Preview my profile"
          >
            <Ionicons name="eye-outline" size={14} color="#E8628F" style={{ marginRight: 6 }} />
            <Text style={styles.previewButtonText}>Preview my profile</Text>
          </TouchableOpacity>
        </View>

        {/* Edit and Settings Actions Row */}
        <View style={styles.editRow}>
          <TouchableOpacity 
            activeOpacity={0.85} 
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit profile details"
          >
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.editGradient}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.gearBtn}
            onPress={() => navigation.navigate('Preferences')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dating preferences"
          >
            <Ionicons name="options-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Completeness Score Card */}
        <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
          <ProfileScoreCard
            profile={profile}
            style={{ width: '100%' }}
            onItemPress={(route) => navigation.navigate(route)}
          />
        </View>

        {/* Life Moments Horizontal Scroll */}
        <View style={styles.momentsSection}>
          <Text style={styles.sectionHeading}>Life Moments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentsScroll}>
            {lifeMoments.map((photoUrl, idx) => (
              <View key={`moment-${idx}`} style={styles.momentCard}>
                <Image source={{ uri: photoUrl }} style={styles.momentImage as any} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Prompts Section */}
        <View style={styles.promptsSection}>
          {demoPrompts.map((pa, idx) => (
            <View key={`prompt-${idx}`} style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{pa.promptQuestion || pa.prompt?.questionText}</Text>
              <Text style={styles.promptAnswer}>{pa.answerText}</Text>
            </View>
          ))}
        </View>

        {/* The Vibe (Interests) Section */}
        <View style={styles.vibeSection}>
          <Text style={styles.sectionHeading}>The Vibe</Text>
          <View style={styles.vibeChips}>
            {(profile?.interests && profile.interests.length > 0 ? profile.interests : ['Fine Art', 'Vinyl', 'Late Night Jazz', 'Architecture', 'Mid-century Modern']).map((tag, idx) => (
              <View key={`vibe-${idx}`} style={styles.vibeChip}>
                <Text style={styles.vibeChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Premium Promo Card (Gold Dark Card styling) */}
        <TouchableOpacity 
          style={styles.premiumPromo} 
          onPress={() => navigation.navigate('Premium')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Upgrade your picks"
        >
          <LinearGradient
            colors={['#1F0A27', '#14051A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumGradient}
          >
            <Text style={styles.premiumPromoLabel}>⭐ LOVLY GOLD</Text>
            <Text style={styles.premiumPromoTitle}>Unlock Elena's Top Picks</Text>
            <Text style={styles.premiumPromoSubtitle}>
              See who is showing interest and get priority in discovery feed.
            </Text>
            <TouchableOpacity 
              style={styles.premiumPromoBtn}
              onPress={() => navigation.navigate('Premium')}
            >
              <LinearGradient
                colors={Gradients.primary.colors}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.premiumPromoBtnGradient}
              >
                <Text style={styles.premiumPromoBtnText}>Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Utilities List */}
        <View style={styles.utilitySection}>
          {/* View Insights / Analytics */}
          <TouchableOpacity 
            style={styles.utilityRow} 
            onPress={() => navigation.navigate('Analytics')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View Profile Insights"
          >
            <View style={styles.utilityLeft}>
              <Ionicons name="bar-chart-outline" size={20} color={Colors.text} style={styles.utilityIcon} />
              <Text style={styles.utilityLabel}>View Profile Insights</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Profile Boost Row */}
          <TouchableOpacity 
            style={[styles.utilityRow, { borderBottomWidth: 0 }]} 
            onPress={activateBoost}
            activeOpacity={boostSeconds > 0 ? 1 : 0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={boostSeconds > 0 ? "Boost is active" : "Boost your profile"}
          >
            <View style={styles.utilityLeft}>
              <Ionicons 
                name="rocket-outline" 
                size={20} 
                color={boostSeconds > 0 ? '#E8628F' : Colors.text} 
                style={styles.utilityIcon} 
              />
              <View>
                <Text style={[styles.utilityLabel, boostSeconds > 0 && { color: '#E8628F', fontWeight: '700' }]}>
                  {boostSeconds > 0 ? 'Profile Boost Active!' : 'Boost Your Profile'}
                </Text>
                {boostSeconds > 0 ? (
                  <Text style={styles.boostSub}>
                    Extra visibility for {formatBoostTime(boostSeconds)} remaining
                  </Text>
                ) : (
                  <Text style={styles.boostSub}>
                    Be seen by up to 10x more people for 30 minutes
                  </Text>
                )}
              </View>
            </View>
            {boostSeconds === 0 && (
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Verification Card (Selfie verification) */}
        {!profile?.isVerified && (
          <TouchableOpacity 
            style={styles.verifyCard} 
            onPress={() => navigation.navigate('PhotoVerification')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Get Verified"
          >
            <LinearGradient
              colors={['#1F0A27', '#14051A']}
              style={styles.verifyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.verifyHeaderRow}>
                <Ionicons name="shield-checkmark" size={20} color="#E8628F" style={{ marginRight: 8 }} />
                <Text style={styles.verifyTitle}>Get Verified</Text>
              </View>
              <Text style={styles.verifyText}>Prove it's you to get a blue checkmark and increase matches by 200%!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Safety Section */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety Center 🛡️</Text>
          <Text style={styles.safetyText}>Tips and guidelines for matches, safety settings, and community standards.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    height: 50,
    backgroundColor: Colors.background,
  },
  barBrand: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.serif,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { paddingBottom: 100, backgroundColor: Colors.background },
  
  // Hero organic teardrop mask: rounded top-left, top-right, bottom-left, sharp bottom-right
  heroWrap: {
    width: width - 32,
    height: width * 1.05,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 180,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: Spacing.md,
    ...Shadow.md,
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLetter: {
    fontSize: 72,
    color: Colors.textMuted,
    fontWeight: '800',
  },
  infoSection: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.fontFamily.serif,
    fontStyle: 'italic',
  },
  jobText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 4,
    fontFamily: Typography.fontFamily.serif,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  editRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  editBtn: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  editGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.sansSerif,
  },
  gearBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentsSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.fontFamily.serif,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  momentsScroll: {
    paddingLeft: Spacing.xl,
  },
  momentCard: {
    width: 140,
    height: 200,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  momentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promptsSection: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  promptCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  promptQuestion: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Typography.fontFamily.sansSerif,
    marginBottom: Spacing.xs,
  },
  promptAnswer: {
    fontSize: 17,
    color: Colors.text,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.serif,
    lineHeight: 24,
  },
  vibeSection: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  vibeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  vibeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#E8628F' + '10',
    borderWidth: 1,
    borderColor: '#E8628F' + '20',
  },
  vibeChipText: {
    color: '#E8628F',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.sansSerif,
  },
  
  // Premium Card
  premiumPromo: {
    width: width - 32,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    alignSelf: 'center',
    ...Shadow.md,
  },
  premiumGradient: {
    padding: 24,
    alignItems: 'flex-start',
  },
  premiumPromoLabel: {
    fontSize: 10,
    color: '#F1D5A5',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  premiumPromoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.serif,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  premiumPromoSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
    fontFamily: Typography.fontFamily.sansSerif,
    marginBottom: Spacing.md,
  },
  premiumPromoBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignSelf: 'stretch',
    ...Shadow.primary,
  },
  premiumPromoBtnGradient: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumPromoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  
  safetyCard: {
    width: width - 32,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 40,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.xs,
  },
  safetyText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    fontFamily: Typography.fontFamily.sansSerif,
  },

  editBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#E8628F',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    ...Shadow.sm,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(232, 98, 143, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 98, 143, 0.15)',
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8628F',
    fontFamily: Typography.fontFamily.sansSerif,
  },

  // Utility List Row Styles
  utilitySection: {
    width: width - 32,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1.5,
    borderColor: Colors.border,
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  utilityIcon: {
    marginRight: Spacing.md,
  },
  utilityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  boostSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: Typography.fontFamily.sansSerif,
  },

  // Verification Card
  verifyCard: {
    width: width - 32,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  verifyGradient: {
    padding: 18,
    alignItems: 'flex-start',
  },
  verifyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.serif,
  },
  verifyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
    fontFamily: Typography.fontFamily.sansSerif,
  },
});
