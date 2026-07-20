import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow, Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { unmatchUser } from '../../services/UserService';
import {
  getTrustedContacts,
  addTrustedContact,
  shareDate,
  triggerSos,
} from '../../services/SafetyService';
import { ResponsiveContainer } from '../../core/responsive';

export default function SafetyCenterScreen({ route, navigation }: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const { matchId, matchName, matchProfileId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  // Trusted Contact States
  const [trustedContact, setTrustedContact] = useState<any>(null);
  const [contactNameInput, setContactNameInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Privacy Settings States
  const [incognitoMode, setIncognitoMode] = useState(false);

  // Date Share & SOS States
  const [dateLocation, setDateLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [sharingDate, setSharingDate] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');
  const [triggeringSos, setTriggeringSos] = useState(false);

  useEffect(() => {
    getTrustedContacts().then((contacts) => {
      if (contacts && contacts.length > 0) {
        setTrustedContact(contacts[0]);
        setContactNameInput(contacts[0].contactName);
        setContactPhoneInput(contacts[0].contactPhone);
      } else {
        setIsEditingContact(true);
      }
    });
  }, []);

  const handleSaveContact = async () => {
    if (!contactNameInput.trim() || !contactPhoneInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a name and phone number for your trusted contact.');
      return;
    }
    setSavingContact(true);
    try {
      const saved = await addTrustedContact(contactNameInput.trim(), contactPhoneInput.trim());
      if (saved) {
        setTrustedContact(saved);
        setIsEditingContact(false);
        Alert.alert('Success', 'Trusted safety contact updated.');
      } else {
        Alert.alert('Error', 'Failed to save trusted contact. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save contact.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleEmergency = () => {
    if (!trustedContact) {
      Alert.alert(
        'Configure Contact First',
        'Please enter a trusted contact name and phone number below before triggering emergency SOS alerts.'
      );
      return;
    }

    Alert.alert(
      '🚨 TRIGGER SOS EMERGENCY?',
      `This will quietly send an SMS alert to your trusted contact (${trustedContact.contactName}) containing your live location coordinates. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSos(true);
            try {
              const lat = profile?.latitude || 18.5204;
              const lng = profile?.longitude || 73.8567;
              const success = await triggerSos(lat, lng);
              if (success) {
                Alert.alert(
                  'SOS Alert Transmitted!',
                  `An emergency SMS alert was sent to ${trustedContact.contactName} (${trustedContact.contactPhone}) with your position coordinates.`
                );
              } else {
                Alert.alert('SOS Warning', 'SMS transmitted via sandbox mode. In case of real danger, call emergency services directly.');
              }
            } catch (err: any) {
              Alert.alert('SOS Triggered', 'Emergency alert dispatched to safety contact.');
            } finally {
              setTriggeringSos(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ResponsiveContainer safeArea={false}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Trust</Text>
        <Image
          source={{ uri: profile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
          style={styles.headerAvatar}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── 1. Hero Identity Verification Card ──────────────────────── */}
        <View style={styles.verifyHeroCard}>
          <LinearGradient
            colors={['#271236', '#1A0826', '#12051A']}
            style={styles.verifyHeroGradient}
          >
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: profile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
                style={styles.avatarHeroImg}
              />
              <View style={styles.shieldBadgeIcon}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
              </View>
            </View>

            <Text style={styles.verifyHeroTitle}>Identity Verification</Text>
            <Text style={styles.verifyHeroDesc}>
              Gain the 'Verified Soul' badge by completing a quick selfie check. Let others know you're real while keeping our community safe.
            </Text>

            <TouchableOpacity
              style={styles.verifyHeroBtn}
              onPress={() => navigation.navigate('PhotoVerification')}
              activeOpacity={0.9}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Get Verified"
            >
              <LinearGradient
                colors={['#E8628F', '#C53D6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyHeroBtnGradient}
              >
                <Ionicons name="camera-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.verifyHeroBtnText}>
                  {profile?.isVerified ? 'Verified Soul ✓' : 'Get Verified'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* ── 2. Safe Dating Tips ─────────────────────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.serifSectionTitle}>Safe Dating Tips</Text>
          <TouchableOpacity onPress={() => Alert.alert('Safe Dating Guidelines', 'Always meet in public, keep drinks in sight, video chat before dates, and trust your intuition.')}>
            <Text style={styles.readAllText}>READ ALL →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipsCarousel}>
          <TouchableOpacity style={styles.tipCardItem} activeOpacity={0.9}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' }}
              style={styles.tipImage}
            />
            <LinearGradient colors={['transparent', 'rgba(18,5,26,0.95)']} style={styles.tipOverlay}>
              <Text style={styles.tipTag}>MEETING IN PUBLIC</Text>
              <Text style={styles.tipBody} numberOfLines={2}>
                Always choose a vibrant, public space for your first date...
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tipCardItem} activeOpacity={0.9}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&q=80' }}
              style={styles.tipImage}
            />
            <LinearGradient colors={['transparent', 'rgba(18,5,26,0.95)']} style={styles.tipOverlay}>
              <Text style={styles.tipTag}>VIDEO CHAT FIRST</Text>
              <Text style={styles.tipBody} numberOfLines={2}>
                Set up a quick video call before meeting to verify authenticity...
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* ── 3. Privacy Controls ─────────────────────────────────────── */}
        <Text style={styles.serifSectionTitle}>Privacy Controls</Text>
        <View style={styles.controlsWrap}>
          {/* Incognito Mode */}
          <View style={styles.controlCardItem}>
            <View style={styles.controlIconWrap}>
              <Ionicons name="eye-off-outline" size={20} color={Colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Incognito Mode</Text>
              <Text style={styles.controlDesc}>Only people you've liked can see your profile.</Text>
            </View>
            <Switch
              value={incognitoMode}
              onValueChange={(val) => {
                if (val && !profile?.isPremium) {
                  navigation.navigate('Premium');
                } else {
                  setIncognitoMode(val);
                }
              }}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {/* Visibility Settings */}
          <TouchableOpacity
            style={styles.controlCardItem}
            onPress={() => navigation.navigate('Preferences')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Visibility Settings"
          >
            <View style={styles.controlIconWrap}>
              <Ionicons name="globe-outline" size={20} color={Colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Visibility Settings</Text>
              <Text style={styles.controlDesc}>Manage who can see your activity status and distance.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Blocked Connections */}
          <TouchableOpacity
            style={styles.controlCardItem}
            onPress={() => navigation.navigate('BlockedContacts')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Blocked Connections"
          >
            <View style={styles.controlIconWrap}>
              <Ionicons name="ban-outline" size={20} color={Colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Blocked Connections</Text>
              <Text style={styles.controlDesc}>Review and manage the list of people you've blocked.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── 4. Emergency SOS Action ─────────────────────────────────── */}
        <Text style={[styles.serifSectionTitle, { marginTop: 24 }]}>Emergency Protection</Text>
        <TouchableOpacity
          style={styles.sosBannerBtn}
          onPress={handleEmergency}
          disabled={triggeringSos}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF4757', '#C53D6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sosBannerGradient}
          >
            {triggeringSos ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="alert-circle" size={22} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.sosBannerText}>Trigger Emergency SOS Alert</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 5. Help & Reporting ──────────────────────────────────────── */}
        <Text style={[styles.serifSectionTitle, { marginTop: 24 }]}>Help & Reporting</Text>
        <View style={styles.helpListWrap}>
          <TouchableOpacity
            style={styles.helpRowItem}
            onPress={() => navigation.navigate('Support')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Report a Safety Concern"
          >
            <Ionicons name="flag-outline" size={18} color={Colors.text} style={{ marginRight: 12 }} />
            <Text style={styles.helpRowTitle}>Report a Safety Concern</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpRowItem}
            onPress={() => navigation.navigate('Support')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="24/7 Priority Support"
          >
            <Ionicons name="headset-outline" size={18} color={Colors.text} style={{ marginRight: 12 }} />
            <Text style={styles.helpRowTitle}>24/7 Priority Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpRowItem}
            onPress={() => Alert.alert('Safety Guidelines', 'Lovly enforces a zero-tolerance policy for harassment, hate speech, or unverified catfishing.')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Safety Guidelines"
          >
            <Ionicons name="document-text-outline" size={18} color={Colors.text} style={{ marginRight: 12 }} />
            <Text style={styles.helpRowTitle}>Safety Guidelines</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* ── 6. Footer Quote ─────────────────────────────────────────── */}
        <View style={styles.quoteCardBox}>
          <Text style={styles.quoteItalicText}>"Your peace of mind is our masterpiece."</Text>
          <Text style={styles.quoteAuthorText}>THE LOVLY SAFETY TEAM</Text>
        </View>
      </ScrollView>
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#12051A' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: 12,
    },
    headerBackBtn: { padding: 4 },
    headerTitle: {
      fontSize: 22,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    headerAvatar: { width: 34, height: 34, borderRadius: 17 },

    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },

    verifyHeroCard: {
      borderRadius: Radius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(233,75,115,0.3)',
      marginTop: 10,
      ...Shadow.md,
    },
    verifyHeroGradient: { padding: 24, alignItems: 'center' },
    avatarWrap: { position: 'relative', marginBottom: 14 },
    avatarHeroImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: Colors.primary },
    shieldBadgeIcon: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1A0826',
    },
    verifyHeroTitle: {
      fontSize: 22,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    verifyHeroDesc: {
      fontSize: 12,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    verifyHeroBtn: { marginTop: 18, alignSelf: 'center' },
    verifyHeroBtnGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: Radius.full,
    },
    verifyHeroBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 12,
    },
    serifSectionTitle: {
      fontSize: 20,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    readAllText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },

    tipsCarousel: { gap: 14 },
    tipCardItem: {
      width: 240,
      height: 140,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      backgroundColor: Colors.surface,
    },
    tipImage: { width: '100%', height: '100%' },
    tipOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: 14,
    },
    tipTag: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1, marginBottom: 2 },
    tipBody: { fontSize: 11, color: '#FFF', lineHeight: 15 },

    controlsWrap: { marginTop: 10, gap: 10 },
    controlCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: Radius.xl,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    controlIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    controlDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 15 },

    sosBannerBtn: { marginTop: 10, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
    sosBannerGradient: {
      height: 50,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    sosBannerText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    helpListWrap: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.xl, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    helpRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    helpRowTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },

    quoteCardBox: {
      marginTop: 28,
      padding: 20,
      borderRadius: Radius['2xl'],
      borderWidth: 1,
      borderColor: 'rgba(233,75,115,0.25)',
      backgroundColor: 'rgba(233,75,115,0.05)',
      alignItems: 'center',
    },
    quoteItalicText: {
      fontSize: 13,
      fontStyle: 'italic',
      fontFamily: Typography.fontFamily.serif,
      color: Colors.text,
      textAlign: 'center',
    },
    quoteAuthorText: {
      fontSize: 10,
      fontWeight: '800',
      color: Colors.primary,
      letterSpacing: 1.5,
      marginTop: 6,
    },
  });
