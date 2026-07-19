import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { updateUserProfile, cancelSubscription } from '../../services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import i18n from '../../i18n';

export default function SettingsScreen({ navigation }) {
  const { colors: Colors, themeMode, setThemeMode, language, setLanguage } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();
  const [notifications, setNotifications] = useState(profile?.notificationsEnabled !== false);
  const [showActive, setShowActive] = useState(true);
  const [incognito, setIncognito] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Privacy and Visibility Switches states
  const [hideDistance, setHideDistance] = useState(profile?.hideDistance || false);
  const [paused, setPaused] = useState(profile?.isActive === false);

  // Women Message First feature (only applies to women)
  const isWoman = profile?.gender === 'Woman';
  const [womenMessageFirst, setWomenMessageFirst] = useState(profile?.womenMessageFirstEnabled || false);

  const handleToggleNotifications = async (val) => {
    setNotifications(val);
    if (user && profile) {
      setProfile({ ...profile, notificationsEnabled: val });
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../../config/firebase');
      try {
        await updateDoc(doc(db, 'profiles', user.uid), { notificationsEnabled: val });
      } catch (e) {
        console.warn('Failed syncing notifications switch to Firestore:', e.message);
      }
    }
  };

  const handleOpenPrivacy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://Lovlyapp.com/privacy');
    } catch (err) {
      console.warn('Error opening privacy policy:', err);
      Alert.alert('Error', 'Unable to open browser.');
    }
  };

  const handleOpenTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://Lovlyapp.com/terms');
    } catch (err) {
      console.warn('Error opening terms of service:', err);
      Alert.alert('Error', 'Unable to open browser.');
    }
  };

  const handleToggleHideDistance = async (val) => {
    setHideDistance(val);
    if (user && profile) {
      setProfile({ ...profile, hideDistance: val });
      await updateUserProfile(user.uid, { hideDistance: val });
    }
  };

  const handleTogglePauseAccount = async (val) => {
    setPaused(val);
    if (user && profile) {
      const activeState = !val; // paused = true means isActive = false
      setProfile({ ...profile, isActive: activeState });
      await updateUserProfile(user.uid, { isActive: activeState });
      Alert.alert(
        activeState ? "Profile Active ⚡" : "Profile Paused 💤",
        activeState 
          ? "Your profile is visible again and matches will load." 
          : "Your profile is now hidden from new matches. You can still chat with existing matches!"
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Lovly?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: async () => {
          try {
            setLoggingOut(true);
            if (user) {
              await AsyncStorage.removeItem(`profileComplete_${user.uid}`);
            }
            await signOut(auth);
            // AuthContext will detect null user and redirect to Onboarding automatically
          } catch (err) {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        }}
      ]
    );
  };

  const handleToggleWomenMessageFirst = async (val) => {
    setWomenMessageFirst(val);
    if (user && profile) {
      setProfile({ ...profile, womenMessageFirstEnabled: val });
      await updateUserProfile(user.uid, { womenMessageFirstEnabled: val });
    }
  };

  const handleCancelSub = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your premium subscription? You will lose premium perks at the end of the current billing cycle.",
      [
        { text: "Keep Plan", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            setIsCanceling(true);
            try {
              const res = await cancelSubscription();
              if (res.success) {
                setProfile({ ...profile, isPremium: false, tier: 'free', subscriptionStatus: 'canceled' });
                Alert.alert("Canceled", "Your subscription has been successfully canceled.");
              } else {
                Alert.alert("Error", res.error || "Failed to cancel subscription.");
              }
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to cancel subscription.");
            } finally {
              setIsCanceling(false);
            }
          }
        }
      ]
    );
  };

  const handleBlockList = () => {
    navigation.navigate('BlockedContacts');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account Settings */}
        <Text style={styles.groupTitle}>{i18n.t('settings.accountSettings')}</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="call-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.phoneNumber')}</Text>
            </View>
            <Text style={styles.itemVal}>{auth?.currentUser?.phoneNumber || 'Not set'}</Text>
          </View>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="mail-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.email')}</Text>
            </View>
            <Text style={styles.itemVal} numberOfLines={1}>{auth?.currentUser?.email || 'Not set'}</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.groupTitle}>{i18n.t('settings.notifications')}</Text>
        <View style={styles.settingGroup}>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.pushNotifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Appearance Settings */}
        <Text style={styles.groupTitle}>{i18n.t('settings.appearance')}</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="moon-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.darkMode')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setThemeMode('light')} style={[styles.themeBtn, themeMode === 'light' && styles.themeBtnActive]}>
                <Text style={[styles.themeBtnText, themeMode === 'light' && styles.themeBtnTextActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setThemeMode('dark')} style={[styles.themeBtn, themeMode === 'dark' && styles.themeBtnActive]}>
                <Text style={[styles.themeBtnText, themeMode === 'dark' && styles.themeBtnTextActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setThemeMode('system')} style={[styles.themeBtn, themeMode === 'system' && styles.themeBtnActive]}>
                <Text style={[styles.themeBtnText, themeMode === 'system' && styles.themeBtnTextActive]}>System</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="language-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.language')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.themeBtn, language === 'en' && styles.themeBtnActive]}>
                <Text style={[styles.themeBtnText, language === 'en' && styles.themeBtnTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLanguage('mr')} style={[styles.themeBtn, language === 'mr' && styles.themeBtnActive]}>
                <Text style={[styles.themeBtnText, language === 'mr' && styles.themeBtnTextActive]}>मराठी</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <Text style={styles.groupTitle}>{i18n.t('settings.privacySettings')}</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="eye-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>{i18n.t('settings.showActiveStatus')}</Text>
            </View>
            <Switch
              value={showActive}
              onValueChange={setShowActive}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="location-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Hide My Distance</Text>
            </View>
            <Switch
              value={hideDistance}
              onValueChange={handleToggleHideDistance}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="pause-circle-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Pause My Account</Text>
            </View>
            <Switch
              value={paused}
              onValueChange={handleTogglePauseAccount}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="glasses-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Incognito Mode (Premium)</Text>
            </View>
            <Switch
              value={incognito}
              onValueChange={(val) => {
                if (val) {
                  if (profile?.isPremium) {
                    setIncognito(true);
                    Alert.alert("Incognito Mode Active 🕵️", "Your profile is now hidden from new matches until you swipe on them.");
                  } else {
                    navigation.navigate('Premium');
                  }
                } else {
                  setIncognito(false);
                }
              }}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
          <TouchableOpacity style={styles.settingItem} onPress={handleBlockList} accessible={true} accessibilityLabel="Blocked Contacts" accessibilityRole="button">
            <View style={styles.itemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Blocked Contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Support')} accessible={true} accessibilityLabel="Help and Support" accessibilityRole="button">
            <View style={styles.itemLeft}>
              <Ionicons name="help-circle-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Subscription Settings */}
        <Text style={styles.groupTitle}>Subscription</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Current Plan</Text>
            </View>
            <Text style={[styles.itemVal, { fontWeight: '700', color: profile?.isPremium ? Colors.primary : Colors.textMuted }]}>
              {profile?.isPremium ? 'Lovly Premium 👑' : (profile?.tier === 'plus' ? 'Lovly Plus ⭐' : 'Free Tier')}
            </Text>
          </View>
          {(profile?.isPremium || (profile?.tier && profile?.tier !== 'free')) && (
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomWidth: 0 }]} 
              onPress={handleCancelSub}
              disabled={isCanceling}
              accessible={true} accessibilityLabel="Cancel Subscription" accessibilityRole="button"
            >
              <View style={styles.itemLeft}>
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} style={styles.itemIcon} />
                <Text style={[styles.itemLabel, { color: Colors.error }]}>Cancel Subscription</Text>
              </View>
              {isCanceling ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={Colors.error} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Women Message First - only shown to women */}
        {isWoman && (
          <>
            <Text style={styles.groupTitle}>Matching Preferences</Text>
            <View style={styles.settingGroup}>
              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.itemLeft, { flex: 1, marginRight: 12 }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} style={styles.itemIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>Women Message First</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 15 }}>
                      You get exclusive right to send the first message. Your match has 24 hrs to respond.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={womenMessageFirst}
                  onValueChange={handleToggleWomenMessageFirst}
                  trackColor={{ true: Colors.primary, false: Colors.border }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </>
        )}

        {/* About & Legal */}
        <Text style={styles.groupTitle}>About</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleOpenPrivacy}
            accessible={true} accessibilityLabel="Privacy Policy" accessibilityRole="button"
          >
            <View style={styles.itemLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]} 
            onPress={handleOpenTerms}
            accessible={true} accessibilityLabel="Terms of Service" accessibilityRole="button"
          >
            <View style={styles.itemLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut} accessible={true} accessibilityLabel="Log Out" accessibilityRole="button">
          {loggingOut
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.logoutText}>{i18n.t('settings.logOut')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} accessible={true} accessibilityLabel="Delete Account" accessibilityRole="button" onPress={() => Alert.alert(
          'Delete Account',
          'This will permanently delete your account and all your data. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                if (user) {
                  await AsyncStorage.removeItem(`profileComplete_${user.uid}`);
                }
                await auth?.currentUser?.delete();
              } catch (err) {
                Alert.alert('Error', 'Please log out and log back in before deleting your account.');
              }
            }}
          ]
        )}>
          <Text style={styles.deleteText}>{i18n.t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, zIndex: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  settingGroup: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl, overflow: 'hidden', ...Shadow.sm },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { marginRight: Spacing.md },
  itemLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemVal: { fontSize: 14, color: Colors.textMuted },
  themeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  themeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  themeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  themeBtnTextActive: { color: Colors.white },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius['2xl'], paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl, ...Shadow.sm },
  logoutText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  deleteButton: { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  deleteText: { color: Colors.error, fontSize: Typography.fontSize.sm, fontWeight: '600' },
});
