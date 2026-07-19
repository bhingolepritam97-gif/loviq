import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import VerifiedBadge from '../../components/VerifiedBadge';
import ProfileScoreCard from '../../components/ProfileScoreCard';
import AIBioSuggestions from '../../components/AIBioSuggestions';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, fetchAiSuggestions } from '../../services/UserService';
import { calculateProfileScore } from '../../utils/calculateProfileScore';
import { Alert } from 'react-native';

export default function EditProfileScreen({ navigation, route }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();
  
  // Local state for profile inputs
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [job, setJob] = useState(profile?.job || 'Product Designer');
  const [school, setSchool] = useState(profile?.school || 'NYU');
  const [intent, setIntent] = useState(profile?.intent || 'Long-term');
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [exercise, setExercise] = useState(profile?.exercise || null);
  const [drinking, setDrinking] = useState(profile?.drinking || null);
  const [pets, setPets] = useState(profile?.pets || null);
  const [starSign, setStarSign] = useState(profile?.starSign || null);
  const [anthemSong, setAnthemSong] = useState(profile?.anthemSong || '');
  const [anthemArtist, setAnthemArtist] = useState(profile?.anthemArtist || '');

  // Unique Profile Features
  const [vibeTagsStr, setVibeTagsStr] = useState(profile?.vibeTags ? profile.vibeTags.join(', ') : '');
  const [puneNeighborhood, setPuneNeighborhood] = useState(profile?.puneNeighborhood || '');
  const [puneSpot, setPuneSpot] = useState(profile?.puneSpot || '');
  const [lookingFor, setLookingFor] = useState(profile?.lookingFor || '');
  
  // Listen to updates from ManagePhotos and ManagePrompts screens
  const [photos, setPhotos] = useState(profile?.photos || []);
  const [prompts, setPrompts] = useState(profile?.prompts || []);

  // AI Suggestions states
  const [aiSuggestionsVisible, setAiSuggestionsVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const handleGetBioSuggestions = async () => {
    setAiSuggestionsVisible(true);
    setAiLoading(true);
    try {
      const suggestions = await fetchAiSuggestions({
        type: 'bio',
        text: bio,
        interests: profile?.interests || [],
        promptQuestion: ''
      });
      setAiSuggestions(suggestions);
    } catch (err) {
      console.warn('Failed to get bio suggestions:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    // When returning from photo or prompt editing, reload the updated session states
    const unsubscribe = navigation.addListener('focus', () => {
      if (profile) {
        setPhotos([...(profile.photos || [])]);
        setPrompts([...(profile.prompts || [])]);
      }
    });
    return unsubscribe;
  }, [navigation, profile]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const updatedData: any = {
      name,
      bio,
      job,
      school,
      intent,
      photos,
      prompts,
      height: height ? parseInt(height, 10) : null,
      exercise,
      drinking,
      pets,
      starSign,
      anthemSong: anthemSong || null,
      anthemArtist: anthemArtist || null,
      puneNeighborhood: puneNeighborhood || null,
      puneSpot: puneSpot || null,
      lookingFor: lookingFor || null,
      vibeTags: vibeTagsStr ? vibeTagsStr.split(',').map(s => s.trim()).filter(s => s).slice(0, 5) : [],
    };
    // Recalculate and persist the profile score on every save
    const liveProfile = { ...profile, ...updatedData };
    const { score } = calculateProfileScore(liveProfile);
    updatedData.profileScore = score;
    try {
      await updateUserProfile(user.uid, updatedData);
      setProfile({
        ...profile,
        ...updatedData
      });
      navigation.goBack();
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving} accessible={true} accessibilityLabel="Save profile edits" accessibilityRole="button">
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Excellence Score Card (live, reads local state) ── */}
        <ProfileScoreCard
          profile={{
            ...profile,
            bio,
            photos,
            prompts,
            exercise,
            drinking,
            pets,
            starSign,
          }}
          compact={false}
          onItemPress={(route) => {
            if (route === 'EditProfile') {
              // Already on EditProfile — scroll to relevant section instead
              return;
            }
            navigation.navigate(route);
          }}
          style={{ marginBottom: Spacing.lg }}
        />

        {/* SECTION: PHOTOS HUB CARD */}
        <TouchableOpacity 
          style={styles.sectionCard} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('ManagePhotos')}
          accessible={true} accessibilityLabel="Manage Photos" accessibilityRole="button"
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🖼️</Text>
              <Text style={styles.sectionTitle}>PHOTOS</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          <View style={styles.photosPreviewGrid}>
            {Array.from({ length: 6 }).map((_, idx) => {
              const photo = photos[idx];
              return (
                <View key={idx} style={styles.photoThumbSlot}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.photoThumb} />
                  ) : (
                    <View style={styles.emptyPhotoThumbSlot}>
                      <Text style={styles.plusSign}>+</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* ── Verification banner ──────────────────────────────────────────────
            Placed directly below photos so it's in the natural flow of editing.
            Shows either a green "Verified" status chip or an amber CTA.
        ────────────────────────────────────────────────────────────────────── */}
        {profile?.isVerified ? (
          /* ── Already verified: show a green confirmation chip ── */
          <View style={styles.verifiedBanner}>
            <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            <View style={styles.verifiedBannerText}>
              <Text style={styles.verifiedBannerTitle}>You’re verified ✓</Text>
              <Text style={styles.verifiedBannerSub}>
                {profile.verifiedAt
                  ? `Confirmed ${new Date(profile.verifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                  : 'Photo selfie on file'}
              </Text>
            </View>
            <VerifiedBadge isVerified size="sm" showLabel={false} />
          </View>
        ) : (
          /* ── Not verified: show amber CTA banner ── */
          <TouchableOpacity
            id="get-verified-cta"
            style={styles.unverifiedBanner}
            onPress={() => navigation.navigate('PhotoVerification')}
            activeOpacity={0.85}
            accessible={true} accessibilityLabel="Get verified" accessibilityRole="button"
          >
            <View style={styles.unverifiedBannerLeft}>
              <Ionicons name="shield-outline" size={22} color={Colors.warning} />
              <View style={styles.verifiedBannerText}>
                <Text style={styles.unverifiedBannerTitle}>Get verified →</Text>
                <Text style={styles.unverifiedBannerSub}>
                  Verified profiles get up to 3× more matches
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}
        {/* ───────────────────────────────────────────────────────────────────── */}

        {/* SECTION: BIO CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📝</Text>
              <Text style={styles.sectionTitle}>BIO</Text>
            </View>
            <TouchableOpacity
              id="bio-ai-writer-btn"
              onPress={handleGetBioSuggestions}
              style={styles.aiWriterBtn}
              activeOpacity={0.7}
              accessible={true} accessibilityLabel="Help me write bio with AI" accessibilityRole="button"
            >
              <Text style={styles.aiWriterBtnText}>✨ Help me write</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '700' }}>
              {bio.length}/500
            </Text>
          </View>
          <Input
            placeholder="Write something interesting about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            maxLength={500}
            style={styles.bioInput}
          />
        </View>

        {/* SECTION: PROMPTS CARD */}
        <TouchableOpacity 
          style={styles.sectionCard} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('ManagePrompts')}
          accessible={true} accessibilityLabel="Manage Profile Prompts" accessibilityRole="button"
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎙️</Text>
              <Text style={styles.sectionTitle}>PROFILE PROMPTS</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          
          {prompts.length === 0 ? (
            <View style={styles.emptyPromptsBox}>
              <Text style={styles.emptyPromptsText}>Add prompts to stand out and invite conversations.</Text>
            </View>
          ) : (
            <View style={styles.promptsPreviewList}>
              {prompts.map((prompt) => (
                <View key={prompt.id} style={styles.promptPreviewItem}>
                  <Text style={styles.promptQuestionPreview}>{prompt.question}</Text>
                  <Text style={styles.promptReplyPreview} numberOfLines={2}>"{prompt.reply}"</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* SECTION: BASIC INFO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>👤</Text>
              <Text style={styles.sectionTitle}>BASIC INFO</Text>
            </View>
          </View>
          
          <Input
            label="First Name"
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.infoInput}
          />
          <Input
            label="Job Title"
            placeholder="E.g. Product Designer"
            value={job}
            onChangeText={setJob}
            style={styles.infoInput}
          />
          <Input
            label="School"
            placeholder="E.g. NYU"
            value={school}
            onChangeText={setSchool}
            style={styles.infoInput}
          />
        </View>

        {/* SECTION: PUNE LOCAL CONTEXT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📍</Text>
              <Text style={styles.sectionTitle}>PUNE CONTEXT</Text>
            </View>
          </View>
          <Input
            label="Neighborhood"
            placeholder="E.g. Koregaon Park, Baner"
            value={puneNeighborhood}
            onChangeText={setPuneNeighborhood}
            style={styles.infoInput}
          />
          <Input
            label="Favorite Spot"
            placeholder="E.g. Vohuman Cafe, FC Road"
            value={puneSpot}
            onChangeText={setPuneSpot}
            style={styles.infoInput}
          />
        </View>

        {/* SECTION: VIBE & INTENT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>✨</Text>
              <Text style={styles.sectionTitle}>VIBE & INTENT</Text>
            </View>
          </View>
          <Input
            label="Looking For"
            placeholder="Serious relationship, Something casual..."
            value={lookingFor}
            onChangeText={setLookingFor}
            style={styles.infoInput}
          />
          <Input
            label="Vibe Tags (comma separated, max 5)"
            placeholder="Homebody, Early riser, Coffee addict"
            value={vibeTagsStr}
            onChangeText={setVibeTagsStr}
            style={styles.infoInput}
          />
        </View>

        {/* SECTION: MORE DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📋</Text>
              <Text style={styles.sectionTitle}>MORE DETAILS</Text>
            </View>
          </View>
          <Input
            label="Height (cm)"
            placeholder="e.g. 175"
            value={height}
            onChangeText={(val) => setHeight(val.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={styles.infoInput}
          />
        </View>

        {/* SECTION: DATING INTENT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎯</Text>
              <Text style={styles.sectionTitle}>DATING INTENT</Text>
            </View>
          </View>
          <View style={styles.intentGrid}>
            {[
              { label: 'Long-term', emoji: '💍' },
              { label: 'Long-term, open to short', emoji: '🍕' },
              { label: 'Short-term, open to long', emoji: '⚡' },
              { label: 'Short-term', emoji: '🔥' },
              { label: 'New friends', emoji: '🍻' },
              { label: 'Still figuring it out', emoji: '🤷' }
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.intentPill, intent === item.label && styles.intentPillActive]}
                onPress={() => setIntent(item.label)}
                accessible={true} accessibilityLabel={`Select dating intent: ${item.label}`} accessibilityRole="button"
              >
                <Text style={[styles.intentText, intent === item.label && styles.intentTextActive]}>
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION: BASICS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📋</Text>
              <Text style={styles.sectionTitle}>BASICS (TAP TO TOGGLE)</Text>
            </View>
          </View>

          {/* Exercise */}
          <Text style={styles.basicsSubLabel}>🏋️ Exercise</Text>
          <View style={styles.basicsPillRow}>
            {['Active', 'Sometimes', 'No'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.basicsPill, exercise === opt && styles.basicsPillActive]}
                onPress={() => setExercise(exercise === opt ? null : opt)}
                accessible={true} accessibilityLabel={`Select exercise frequency: ${opt}`} accessibilityRole="button"
              >
                <Text style={[styles.basicsPillText, exercise === opt && styles.basicsPillTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Drinking */}
          <Text style={styles.basicsSubLabel}>🍷 Drinking</Text>
          <View style={styles.basicsPillRow}>
            {['Socially', 'Frequently', 'Never'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.basicsPill, drinking === opt && styles.basicsPillActive]}
                onPress={() => setDrinking(drinking === opt ? null : opt)}
                accessible={true} accessibilityLabel={`Select drinking frequency: ${opt}`} accessibilityRole="button"
              >
                <Text style={[styles.basicsPillText, drinking === opt && styles.basicsPillTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pets */}
          <Text style={styles.basicsSubLabel}>🐶 Pets</Text>
          <View style={styles.basicsPillRow}>
            {['Dog', 'Cat', 'None'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.basicsPill, pets === opt && styles.basicsPillActive]}
                onPress={() => setPets(pets === opt ? null : opt)}
                accessible={true} accessibilityLabel={`Select pets: ${opt}`} accessibilityRole="button"
              >
                <Text style={[styles.basicsPillText, pets === opt && styles.basicsPillTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Star Sign */}
          <Text style={styles.basicsSubLabel}>♈ Star Sign</Text>
          <View style={styles.basicsGrid}>
            {[
              'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
              'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
            ].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.basicsGridPill, starSign === opt && styles.basicsGridPillActive]}
                onPress={() => setStarSign(starSign === opt ? null : opt)}
                accessible={true} accessibilityLabel={`Select star sign: ${opt}`} accessibilityRole="button"
              >
                <Text style={[styles.basicsGridPillText, starSign === opt && styles.basicsGridPillTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION: SPOTIFY ANTHEM */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎵</Text>
              <Text style={styles.sectionTitle}>MY ANTHEM</Text>
            </View>
          </View>
          <Input
            label="Song Title"
            placeholder="e.g. Blinding Lights"
            value={anthemSong}
            onChangeText={setAnthemSong}
            style={styles.infoInput}
          />
          <Input
            label="Artist Name"
            placeholder="e.g. The Weeknd"
            value={anthemArtist}
            onChangeText={setAnthemArtist}
            style={styles.infoInput}
          />
        </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* AI Writer bottom sheet */}
      <AIBioSuggestions
        visible={aiSuggestionsVisible}
        onClose={() => setAiSuggestionsVisible(false)}
        suggestions={aiSuggestions}
        onSelect={(val) => setBio(val)}
        loading={aiLoading}
        type="bio"
      />
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, zIndex: 10 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  saveBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  saveText: { fontSize: Typography.fontSize.base, color: Colors.primary, fontWeight: '800' },
  
  scroll: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 80 },
  
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.2 },
  arrowIcon: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
 
  photosPreviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumbSlot: { width: '31%', aspectRatio: 0.75, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.border },
  photoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyPhotoThumbSlot: { flex: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md },
  plusSign: { fontSize: 20, color: Colors.textMuted },
 
  bioInput: { marginTop: Spacing.xs, minHeight: 80 },
 
  emptyPromptsBox: { padding: Spacing.md, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, alignItems: 'center' },
  emptyPromptsText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  promptsPreviewList: { gap: Spacing.md },
  promptPreviewItem: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  promptQuestionPreview: { fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs },
  promptReplyPreview: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 20 },
 
  infoInput: { marginBottom: Spacing.md },
 
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  intentPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  intentPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  intentText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  intentTextActive: { color: Colors.primary, fontWeight: '700' },
 
  // ── Verification banners
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '14',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  verifiedBannerText: { flex: 1 },
  verifiedBannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  verifiedBannerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
 
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  unverifiedBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  unverifiedBannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  unverifiedBannerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  
  basicsSubLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginTop: Spacing.md, marginBottom: Spacing.xs },
  basicsPillRow: { flexDirection: 'row', gap: Spacing.sm },
  basicsPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  basicsPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  basicsPillText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  basicsPillTextActive: { color: Colors.primary, fontWeight: '700' },
  basicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  basicsGridPill: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  basicsGridPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  basicsGridPillText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  basicsGridPillTextActive: { color: Colors.primary, fontWeight: '700' },

  // AI suggestions button styles
  aiWriterBtn: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  aiWriterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
});
