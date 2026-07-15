import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActionSheetIOS, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import Chip from '../../components/Chip';
import VerifiedBadge from '../../components/VerifiedBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { blockUser, reportUser } from '../../services/UserService';
import { recordSwipe } from '../../services/DiscoverService';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Mock Deep Data if missing from profile
const DEFAULT_PROMPTS = [
  { question: "A shower thought I recently had...", answer: "Why do we say 'slept like a baby' when babies wake up every 2 hours crying?" },
  { question: "I'm looking for...", answer: "Someone to go to concerts with and try new restaurants." },
];
const DEFAULT_INSTAGRAM = [
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300',
  'https://images.unsplash.com/photo-1504609774659-53733a1e9ce1?w=300',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300',
  'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=300',
];
const DEFAULT_BASICS = [
  { icon: '📏', label: "5'9\"" },
  { icon: '🏋️', label: "Active" },
  { icon: '🍷', label: "Social drinker" },
  { icon: '🐶', label: "Has a dog" },
  { icon: '♈', label: "Aries" },
];

export default function ProfileDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = route.params || {};

  if (profile && !profile.id) {
    profile.id = profile.uid || profile.firebaseUid;
  }

  const { user: me, profile: myProfile } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  // Prompt Reply State
  const [replyPrompt, setReplyPrompt] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.skeletonImageHeader} />
        <View style={styles.contentBody}>
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonTextRow} />
            <View style={styles.skeletonTextRowShort} />
          </View>
        </View>
      </View>
    );
  }

  const prompts = profile.prompts || DEFAULT_PROMPTS;
  const instagram = profile.instagramPhotos || DEFAULT_INSTAGRAM;
  
  // Dynamically build basics list including actual height
  const basics = [];
  if (profile.height) {
    basics.push({ icon: '📏', label: `${profile.height} cm` });
  }
  if (profile.exercise) {
    basics.push({ icon: '🏋️', label: profile.exercise });
  }
  if (profile.drinking) {
    basics.push({ icon: '🍷', label: profile.drinking });
  }
  if (profile.pets) {
    basics.push({ icon: '🐶', label: profile.pets });
  }
  if (profile.starSign) {
    basics.push({ icon: '♈', label: profile.starSign });
  }
  
  const sharedInterests = myProfile?.interests?.filter(i => profile.interests?.includes(i)) || [];

  const handleNextPhoto = () => {
    if (activePhotoIndex < profile.photos.length - 1) {
      setActivePhotoIndex(prev => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex > 0) {
      setActivePhotoIndex(prev => prev - 1);
    }
  };

  const handleSwipeAction = async (direction, message = null) => {
    if (!me || !profile) return;
    try {
      const result = await recordSwipe(me.uid, profile.id, direction, profile, message);
      if (result?.limitReached) {
        navigation.navigate('SuperLike');
        return;
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error swiping from profile:', err);
    }
  };

  const handleSendPromptReply = () => {
    if (!replyMessage.trim()) return;
    const fullMessage = `Replying to: "${replyPrompt.question}"\n\n${replyMessage}`;
    handleSwipeAction('super_like', fullMessage);
    setReplyPrompt(null);
    setReplyMessage('');
  };

  const handleBlock = async () => {
    Alert.alert(
      `Block ${profile.name}?`,
      `You will no longer see each other. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: async () => {
            const success = await blockUser(me?.uid, profile.id);
            if (success) {
              Alert.alert('User blocked');
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      `Report ${profile.name}`,
      `Please provide a reason (e.g., Fake Profile, Harassment, Inappropriate Content).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: async (reason) => {
            if (!reason) return;
            const success = await reportUser(me?.uid, profile.id, reason);
            if (success) {
              await blockUser(me?.uid, profile.id);
              Alert.alert('Report submitted', 'We have blocked this user for you.');
              navigation.goBack();
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const showSafetyMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', `Report ${profile.name}`, `Block ${profile.name}`],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleReport();
          if (buttonIndex === 2) handleBlock();
        }
      );
    } else {
      Alert.alert(
        'Safety Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Report ${profile.name}`, onPress: handleReport },
          { text: `Block ${profile.name}`, onPress: handleBlock, style: 'destructive' },
        ]
      );
    }
  };

  return (
    <>
      <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Full Screen Photo Header */}
        <View style={[styles.photoContainer, { height: height * 0.75 }]}>
          <Image source={{ uri: profile.photos[activePhotoIndex] }} style={styles.photo} />
          
          {/* Tap Navigation Overlays */}
          <View style={styles.tapNavigationOverlay}>
            <TouchableOpacity style={styles.tapAreaHalf} onPress={handlePrevPhoto} activeOpacity={1} />
            <TouchableOpacity style={styles.tapAreaHalf} onPress={handleNextPhoto} activeOpacity={1} />
          </View>

          {/* Top Controls */}
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={[styles.topScrim, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.headerControls}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-down" size={28} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={showSafetyMenu}>
                <Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            {/* Indicators */}
            <View style={styles.indicators}>
              {profile.photos.map((_, i) => (
                <View key={i} style={[styles.indicator, activePhotoIndex === i && styles.indicatorActive]} />
              ))}
            </View>
          </LinearGradient>

          {/* Bottom Info Overlay */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bottomScrim}>
            <View style={styles.photoNameRow}>
              <Text style={styles.photoName}>{profile.name}, {profile.age}</Text>
              {/* VerifiedBadge — tappable opens the trust tooltip modal */}
              <VerifiedBadge
                isVerified={!!profile.isVerified}
                size="md"
                showLabel
                tappable
                style={{ marginLeft: Spacing.sm, marginBottom: 3 }}
              />
            </View>
            <Text style={styles.jobText}>💼 {profile.job} {profile.school ? `at ${profile.school}` : ''}</Text>
            <Text style={styles.distanceText}>📍 {profile.cityName ? `${profile.cityName} · ` : ''}{profile.hideDistance ? 'Location Hidden' : (profile.distance ? `${parseFloat(profile.distance).toFixed(1)} miles away` : 'Nearby')}</Text>
          </LinearGradient>
        </View>

        <View style={styles.contentBody}>
          
          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bioText}>{profile.bio || "I'm new here! Say hi!"}</Text>
          </View>

          {/* ── Trust & Safety section ─────────────────────────────────────── */}
          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>Trust & Safety</Text>

            {profile.isVerified ? (
              /* ── VERIFIED ── */
              <View style={styles.trustRow}>
                <View style={[styles.trustIconCircle, styles.trustIconVerified]}>
                  <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
                </View>
                <View style={styles.trustTextBlock}>
                  <Text style={styles.trustStatusLabel}>Photo verified</Text>
                  <Text style={styles.trustStatusSub}>
                    {profile.verifiedAt
                      ? `Confirmed ${new Date(profile.verifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                      : 'Face matches profile photos'}
                  </Text>
                </View>
                <VerifiedBadge isVerified size="sm" showLabel={false} />
              </View>
            ) : (
              /* ── UNVERIFIED ── */
              <View style={styles.trustRow}>
                <View style={[styles.trustIconCircle, styles.trustIconUnverified]}>
                  <Ionicons name="shield-outline" size={18} color={Colors.warning} />
                </View>
                <View style={styles.trustTextBlock}>
                  <Text style={styles.trustStatusLabel}>Not yet verified</Text>
                  <Text style={styles.trustStatusSub}>
                    Photos haven’t been confirmed via selfie
                  </Text>
                </View>
                <VerifiedBadge isVerified={false} size="sm" showLabel={false} />
              </View>
            )}

            {/* Divider + "How it works" link */}
            <View style={styles.trustDivider} />
            <TouchableOpacity
              id="how-verification-works-link"
              style={styles.trustLearnRow}
              onPress={() => navigation.navigate('PhotoVerification')}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.trustLearnText}>How verification works</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
          {/* ─────────────────────────────────────────────────────────────────────── */}

          {/* Basics Section */}
          {basics.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basics</Text>
                <View style={styles.basicsGrid}>
                  {basics.map((item, idx) => (
                    <View key={idx} style={styles.basicPill}>
                      <Text style={styles.basicEmoji}>{item.icon}</Text>
                      <Text style={styles.basicLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Prompts Section */}
          {prompts.length > 0 && (
            <View style={styles.section}>
              {prompts.map((prompt, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.promptCard}
                  activeOpacity={0.7}
                  onPress={() => setReplyPrompt(prompt)}
                >
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                  <View style={styles.promptReplyHint}>
                    <Ionicons name="heart" size={16} color={Colors.primary} />
                    <Text style={styles.promptReplyText}>Like & Reply</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Shared Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            {sharedInterests.length > 0 && (
              <Text style={styles.sharedMatchText}>✨ You both love {sharedInterests.length > 1 ? `${sharedInterests.slice(0, 2).join(' & ')}` : sharedInterests[0]}!</Text>
            )}
            <View style={styles.chips}>
              {profile.interests.map((interest, idx) => {
                const isShared = sharedInterests.includes(interest);
                return (
                  <View key={idx} style={[styles.interestChip, isShared && styles.interestChipShared]}>
                    <Text style={[styles.interestChipText, isShared && styles.interestChipTextShared]}>{interest}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>

      {/* Bottom Swipe Controls removed */}

      {/* Prompt Reply Modal */}
      <Modal
        visible={!!replyPrompt}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReplyPrompt(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setReplyPrompt(null)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Prompt</Text>
              <TouchableOpacity onPress={() => setReplyPrompt(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalPromptPreview}>
              <Text style={styles.modalPromptQuestion}>{replyPrompt?.question}</Text>
              <Text style={styles.modalPromptAnswer}>{replyPrompt?.answer}</Text>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a message..."
              placeholderTextColor={Colors.textMuted}
              multiline
              autoFocus
              value={replyMessage}
              onChangeText={setReplyMessage}
            />
            <TouchableOpacity 
              style={[styles.sendReplyBtn, !replyMessage.trim() && { opacity: 0.5 }]}
              onPress={handleSendPromptReply}
              disabled={!replyMessage.trim()}
            >
              <LinearGradient
                colors={Gradients.primary.colors}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.sendReplyGradient}
              >
                <Text style={styles.sendReplyText}>Send with Super Like ⭐</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  photoContainer: { width: width, position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  tapNavigationOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 10 },
  tapAreaHalf: { flex: 1 },
  
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 20 },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  indicators: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 4, marginTop: Spacing.md },
  indicator: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  indicatorActive: { backgroundColor: Colors.white },
  
  bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, justifyContent: 'flex-end', padding: Spacing.xl, zIndex: 5 },
  photoName: { fontSize: 36, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  jobText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 4 },
  distanceText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  
  contentBody: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, backgroundColor: Colors.background },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  bioText: { fontSize: 16, color: Colors.text, lineHeight: 24, fontWeight: '400' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  // Photo overlay name row — flex so badge sits inline with name text
  photoNameRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: Spacing.sm },

  trustCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  trustTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  trustIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  trustIconVerified: { backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  trustIconUnverified: { backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warning + '40' },
  trustTextBlock: { flex: 1 },
  trustStatusLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  trustStatusSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  trustDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  trustLearnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trustLearnText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  
  basicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  basicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  basicEmoji: { fontSize: 16, marginRight: 6 },
  basicLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },

  promptCard: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  promptQuestion: { fontSize: 14, color: Colors.textMuted, fontWeight: '700', marginBottom: 8 },
  promptAnswer: { fontSize: 20, color: Colors.text, fontWeight: '600', lineHeight: 28 },

  sharedMatchText: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  interestChipShared: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  interestChipText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  interestChipTextShared: { color: Colors.primary },

  spotifyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  spotifyArt: { width: 60, height: 60, borderRadius: 4, backgroundColor: '#333' },
  spotifyInfo: { flex: 1, marginLeft: Spacing.md },
  songTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  artistName: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  spotifyIcon: { marginLeft: Spacing.md },

  instaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  instaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  instaPhoto: { width: (width - Spacing.xl * 2 - 16) / 3, height: (width - Spacing.xl * 2 - 16) / 3, borderRadius: Radius.md, backgroundColor: Colors.surface },

  reportFooter: { paddingVertical: Spacing.xl, alignItems: 'center' },
  reportText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  bottomControls: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
  nopeBtn: { borderWidth: 1.5, borderColor: Colors.border },
  superBtn: { backgroundColor: Colors.surface, width: 44, height: 44, borderRadius: 22 },
  likeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnIcon: { fontSize: 24 },
  btnIconLike: { fontSize: 24 },
  promptReplyHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  promptReplyText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalPromptPreview: { backgroundColor: Colors.background, padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  modalPromptQuestion: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', marginBottom: 4 },
  modalPromptAnswer: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  replyInput: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, color: Colors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  sendReplyBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  sendReplyGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  sendReplyText: { color: Colors.white, fontWeight: '800', fontSize: 16 },

  skeletonImageHeader: { width: '100%', height: height * 0.75, backgroundColor: Colors.border },
  skeletonSection: { marginBottom: Spacing.lg },
  skeletonTitle: { width: '40%', height: 24, borderRadius: Radius.sm, backgroundColor: Colors.border, marginBottom: Spacing.md },
  skeletonTextRow: { width: '100%', height: 16, borderRadius: Radius.sm, backgroundColor: Colors.border, marginBottom: Spacing.xs },
  skeletonTextRowShort: { width: '70%', height: 16, borderRadius: Radius.sm, backgroundColor: Colors.border },
});
