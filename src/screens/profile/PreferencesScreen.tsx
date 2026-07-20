import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/UserService';
import { ResponsiveContainer } from '../../core/responsive';

const SHOW_ME_OPTIONS = ['Women', 'Men', 'Everyone'];

export default function PreferencesScreen({ navigation }: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();

  // Discovery Preferences
  const [distance, setDistance] = useState(profile?.distance_range || 25);
  const [globalMode, setGlobalMode] = useState(profile?.global_mode || false);
  const [ageRange, setAgeRange] = useState<[number, number]>(profile?.age_range || [20, 35]);
  const [showMe, setShowMe] = useState(profile?.interestedIn || 'Women');
  const [verifiedOnly, setVerifiedOnly] = useState(profile?.verifiedOnly || false);

  // Profile Visibility & Privacy Toggles
  const [showOnlineStatus, setShowOnlineStatus] = useState(profile?.showOnlineStatus !== false);
  const [showDistanceVis, setShowDistanceVis] = useState(profile?.showDistanceVis !== false);
  const [showWorkVis, setShowWorkVis] = useState(profile?.showWorkVis !== false);
  const [showEduVis, setShowEduVis] = useState(profile?.showEduVis !== false);
  const [showHeightVis, setShowHeightVis] = useState(profile?.showHeightVis !== false);
  const [incognitoMode, setIncognitoMode] = useState(profile?.incognitoMode || false);
  const [travelMode, setTravelMode] = useState(profile?.travelMode || false);
  const [pausedProfile, setPausedProfile] = useState(profile?.pausedProfile || false);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (user && profile) {
      setSaving(true);
      const updatedPrefs = {
        distance_range: distance,
        global_mode: globalMode,
        age_range: ageRange,
        interestedIn: showMe,
        verifiedOnly,
        showOnlineStatus,
        showDistanceVis,
        showWorkVis,
        showEduVis,
        showHeightVis,
        incognitoMode,
        travelMode,
        pausedProfile,
      };
      setProfile({ ...profile, ...updatedPrefs });
      try {
        await updateUserProfile(user.uid, updatedPrefs);
        Alert.alert('Saved 💾', 'Your visibility and discovery preferences have been updated.');
        navigation.goBack();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update preferences.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <ResponsiveContainer safeArea={false}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visibility & Privacy</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 👁️ Preview My Profile Action ───────────────────────────── */}
        <TouchableOpacity
          style={styles.previewCardBtn}
          onPress={() => navigation.navigate('ProfileDetail', { profile: { ...profile, id: profile?.id || profile?.uid } })}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#271236', '#1A0826']}
            style={styles.previewGradient}
          >
            <Ionicons name="eye-outline" size={22} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewCardTitle}>👁️ Preview My Profile</Text>
              <Text style={styles.previewCardSub}>See how your profile appears to candidates in Discovery</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 🔒 Incognito & Travel Modes ──────────────────────────────── */}
        <Text style={styles.serifSectionTitle}>Security Modes</Text>
        <View style={styles.cardGroup}>
          <View style={styles.toggleRowItem}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>🔒 Incognito Mode</Text>
              <Text style={styles.toggleDesc}>Only people you've liked can see your profile.</Text>
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
            />
          </View>

          <View style={styles.toggleRowItem}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>✈️ Travel Mode (Passport)</Text>
              <Text style={styles.toggleDesc}>Change your location to swipe in any city worldwide.</Text>
            </View>
            <Switch
              value={travelMode}
              onValueChange={(val) => {
                if (val && !profile?.isPremium) {
                  navigation.navigate('Premium');
                } else {
                  setTravelMode(val);
                }
              }}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>⏸️ Pause Profile</Text>
              <Text style={styles.toggleDesc}>Hide profile from new discovery while keeping existing matches.</Text>
            </View>
            <Switch
              value={pausedProfile}
              onValueChange={setPausedProfile}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* ── 👤 Profile Fields Visibility ─────────────────────────────── */}
        <Text style={[styles.serifSectionTitle, { marginTop: 24 }]}>Profile Field Visibility</Text>
        <View style={styles.cardGroup}>
          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleTitle}>🟢 Online Status Indicator</Text>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleTitle}>📍 Distance (Miles away)</Text>
            <Switch
              value={showDistanceVis}
              onValueChange={setShowDistanceVis}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleTitle}>💼 Occupation & Company</Text>
            <Switch
              value={showWorkVis}
              onValueChange={setShowWorkVis}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleTitle}>🎓 Education & University</Text>
            <Switch
              value={showEduVis}
              onValueChange={setShowEduVis}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <View style={[styles.toggleRowItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.toggleTitle}>📏 Height</Text>
            <Switch
              value={showHeightVis}
              onValueChange={setShowHeightVis}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* ── 🛡️ Blocked & Hidden Contacts ─────────────────────────────── */}
        <Text style={[styles.serifSectionTitle, { marginTop: 24 }]}>Safety & Contacts</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.navRowItem}
            onPress={() => navigation.navigate('BlockedContacts')}
          >
            <Ionicons name="shield-outline" size={20} color={Colors.text} style={{ marginRight: 12 }} />
            <Text style={styles.navRowTitle}>🛡️ Blocked Users</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRowItem, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert('Hidden Phone Contacts 🚫', 'Import contacts to prevent friends, family, or exes from seeing your Lovly profile.')}
          >
            <Ionicons name="people-outline" size={20} color={Colors.text} style={{ marginRight: 12 }} />
            <Text style={styles.navRowTitle}>🚫 Block Phone Contacts</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* ── 🌍 Discovery Preferences ─────────────────────────────────── */}
        <Text style={[styles.serifSectionTitle, { marginTop: 24 }]}>Discovery Match Parameters</Text>
        <View style={styles.cardGroup}>
          {/* Show Me Gender */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={styles.toggleTitle}>Show Me</Text>
            <View style={styles.genderPillRow}>
              {SHOW_ME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.genderPillBtn, showMe === opt && styles.genderPillBtnActive]}
                  onPress={() => setShowMe(opt)}
                >
                  <Text style={[styles.genderPillText, showMe === opt && styles.genderPillTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Maximum Distance */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.toggleTitle}>Maximum Distance</Text>
              <Text style={styles.valHighlight}>{distance} miles</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={distance}
              onValueChange={setDistance}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
          </View>

          {/* Age Range */}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.toggleTitle}>Age Range</Text>
              <Text style={styles.valHighlight}>{ageRange[0]} - {ageRange[1]}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[[18, 25], [20, 35], [25, 45], [30, 60]].map(([min, max]) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.presetAgeBtn, ageRange[0] === min && ageRange[1] === max && styles.presetAgeBtnActive]}
                  onPress={() => setAgeRange([min, max])}
                >
                  <Text style={[styles.presetAgeText, ageRange[0] === min && ageRange[1] === max && styles.presetAgeTextActive]}>
                    {min}-{max}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Floating Button */}
        <TouchableOpacity
          style={styles.saveBottomBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#E8628F', '#C53D6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBottomGradient}
          >
            <Text style={styles.saveBottomText}>{saving ? 'Saving Preferences...' : 'Save Visibility & Discovery Settings'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#12051A' },
    headerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: {
      fontSize: 20,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
    },
    saveHeaderBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

    scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

    previewCardBtn: {
      borderRadius: Radius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(233,75,115,0.3)',
      marginTop: 10,
      ...Shadow.md,
    },
    previewGradient: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    previewCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    previewCardSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

    serifSectionTitle: {
      fontSize: 18,
      fontWeight: '400',
      color: Colors.text,
      fontFamily: Typography.fontFamily.serif,
      marginBottom: 10,
    },

    cardGroup: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: Radius['2xl'],
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    toggleRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    toggleTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
    toggleDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 15 },

    navRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    navRowTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },

    genderPillRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    genderPillBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
    },
    genderPillBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    genderPillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    genderPillTextActive: { color: '#FFF' },

    valHighlight: { fontSize: 14, fontWeight: '700', color: Colors.primary },

    presetAgeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
    },
    presetAgeBtnActive: { backgroundColor: 'rgba(233,75,115,0.2)', borderColor: Colors.primary },
    presetAgeText: { fontSize: 11, color: Colors.textMuted },
    presetAgeTextActive: { color: Colors.primary, fontWeight: '700' },

    saveBottomBtn: { marginTop: 28, borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
    saveBottomGradient: { height: 50, justifyContent: 'center', alignItems: 'center' },
    saveBottomText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  });
