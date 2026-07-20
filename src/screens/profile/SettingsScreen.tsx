import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { updateUserProfile, cancelSubscription } from '../../services/UserService';
import { apiClient, clearApiCache } from '../../api/client';
import { socketService } from '../../api/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import i18n from '../../i18n';
import { ResponsiveContainer, useBreakpoints } from '../../core/responsive';

export default function SettingsScreen({ navigation }) {
  const { colors: Colors, themeMode, setThemeMode, language, setLanguage } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoints();
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'appearance' | 'privacy' | 'subscription' | 'matching' | 'about' | 'danger'>('account');
  const { profile, setProfile, user, setUser } = useAuth();
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
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoggingOut(true);
              // Stop active socket listeners
              socketService.disconnect();
              
              // Clear local onboarding status & temp data
              if (user?.uid) {
                await AsyncStorage.removeItem(`profileComplete_${user.uid}`);
              }
              await AsyncStorage.removeItem('mock_user_token');

              // Clear user profile cache & all cached REST endpoints
              await clearApiCache();

              // Clear auth store & local state
              setUser(null);
              setProfile(null);

              // Sign out from Firebase Authentication
              await signOut(auth);
              console.log('[SettingsScreen] ✅ Logout Success — user signed out and navigation reset to Welcome.');
            } catch (err: any) {
              console.error('[Logout] Logout error:', err);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Deleting your account is permanent. Your profile, photos, matches, chats, and messages will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoggingOut(true);
              const currentUid = user?.uid;
              const targetId = profile?.id || currentUid;

              // 1. Stop active socket listeners
              socketService.disconnect();

              // 2. Delete Firestore document profiles/{uid}
              if (currentUid && db) {
                try {
                  await deleteDoc(doc(db, 'profiles', currentUid));
                  console.log('[DeleteAccount] Firestore profiles/' + currentUid + ' deleted.');
                } catch (fsErr: any) {
                  console.warn('[DeleteAccount] Firestore deletion warning:', fsErr.message);
                }
              }

              // 3. Delete backend database user & related data (photos, matches, chats, messages, etc.)
              if (targetId) {
                try {
                  await apiClient(`/users/${targetId}?hard=true`, { method: 'DELETE' });
                  console.log('[DeleteAccount] Backend user data deleted for ID:', targetId);
                } catch (apiErr: any) {
                  console.warn('[DeleteAccount] Backend delete API warning:', apiErr.message);
                }
              }

              // 4. Delete Firebase Authentication user
              if (auth?.currentUser) {
                try {
                  await auth.currentUser.delete();
                  console.log('[DeleteAccount] Firebase Auth account deleted successfully.');
                } catch (authErr: any) {
                  console.warn('[DeleteAccount] Firebase Auth delete warning:', authErr.message);
                  if (authErr.code === 'auth/requires-recent-login') {
                    Alert.alert('Re-authentication Required', 'Please log out and log back in before deleting your account.');
                    setLoggingOut(false);
                    return;
                  }
                }
              }

              // 5. Clear local storage, onboarding state & API cache
              if (currentUid) {
                await AsyncStorage.removeItem(`profileComplete_${currentUid}`);
              }
              await AsyncStorage.removeItem('mock_user_token');
              await clearApiCache();

              // 6. Clear auth store & local state (triggers AppNavigator to reset stack to Welcome/Signup)
              setUser(null);
              setProfile(null);

              console.log('[SettingsScreen] ✅ Delete Success — account fully deleted. Redirected to Welcome.');
            } catch (err: any) {
              console.error('[DeleteAccount] Error deleting account:', err);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          }
        }
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

  const renderAccount = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderAppearance = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderSubscription = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderMatching = () => {
    if (!isWoman) return null;
    return (
      <View style={styles.sectionWrap}>
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
      </View>
    );
  };

  const renderAbout = () => (
    <View style={styles.sectionWrap}>
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
    </View>
  );

  const renderDanger = () => (
    <View style={styles.sectionWrap}>
      <Text style={styles.groupTitle}>Danger Zone</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut} accessible={true} accessibilityLabel="Log Out" accessibilityRole="button">
        {loggingOut
          ? <ActivityIndicator color={Colors.primary} />
          : <Text style={styles.logoutText}>{i18n.t('settings.logOut')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} disabled={loggingOut} accessible={true} accessibilityLabel="Delete Account" accessibilityRole="button" onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>{i18n.t('settings.deleteAccount')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNavList = () => (
    <View style={styles.navList}>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'account' && styles.navItemActive]} 
        onPress={() => setActiveSection('account')}
      >
        <Ionicons name="person-outline" size={18} color={activeSection === 'account' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'account' && styles.navItemTextActive]}>Account</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'notifications' && styles.navItemActive]} 
        onPress={() => setActiveSection('notifications')}
      >
        <Ionicons name="notifications-outline" size={18} color={activeSection === 'notifications' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'notifications' && styles.navItemTextActive]}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'appearance' && styles.navItemActive]} 
        onPress={() => setActiveSection('appearance')}
      >
        <Ionicons name="moon-outline" size={18} color={activeSection === 'appearance' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'appearance' && styles.navItemTextActive]}>Appearance</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'privacy' && styles.navItemActive]} 
        onPress={() => setActiveSection('privacy')}
      >
        <Ionicons name="eye-outline" size={18} color={activeSection === 'privacy' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'privacy' && styles.navItemTextActive]}>Privacy & Support</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'subscription' && styles.navItemActive]} 
        onPress={() => setActiveSection('subscription')}
      >
        <Ionicons name="card-outline" size={18} color={activeSection === 'subscription' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'subscription' && styles.navItemTextActive]}>Subscription</Text>
      </TouchableOpacity>
      {isWoman && (
        <TouchableOpacity 
          style={[styles.navItem, activeSection === 'matching' && styles.navItemActive]} 
          onPress={() => setActiveSection('matching')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={activeSection === 'matching' ? Colors.primary : Colors.text} />
          <Text style={[styles.navItemText, activeSection === 'matching' && styles.navItemTextActive]}>Matching</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'about' && styles.navItemActive]} 
        onPress={() => setActiveSection('about')}
      >
        <Ionicons name="document-text-outline" size={18} color={activeSection === 'about' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'about' && styles.navItemTextActive]}>About & Legal</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.navItem, activeSection === 'danger' && styles.navItemActive]} 
        onPress={() => setActiveSection('danger')}
      >
        <Ionicons name="alert-circle-outline" size={18} color={activeSection === 'danger' ? Colors.primary : Colors.text} />
        <Text style={[styles.navItemText, activeSection === 'danger' && styles.navItemTextActive]}>Danger Zone</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account': return renderAccount();
      case 'notifications': return renderNotifications();
      case 'appearance': return renderAppearance();
      case 'privacy': return renderPrivacy();
      case 'subscription': return renderSubscription();
      case 'matching': return renderMatching();
      case 'about': return renderAbout();
      case 'danger': return renderDanger();
      default: return renderAccount();
    }
  };

  return (
    <ResponsiveContainer safeArea={false}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isPhone ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderAccount()}
          {renderNotifications()}
          {renderAppearance()}
          {renderPrivacy()}
          {renderSubscription()}
          {renderMatching()}
          {renderAbout()}
          {renderDanger()}
        </ScrollView>
      ) : (
        <View style={styles.splitWrapper}>
          <View style={styles.leftPane}>
            {renderNavList()}
          </View>
          <ScrollView style={styles.rightPane} contentContainerStyle={styles.detailScroll}>
            {renderActiveSection()}
          </ScrollView>
        </View>
      )}
    </View>
    </ResponsiveContainer>
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
  splitWrapper: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  leftPane: { width: 280, borderRightWidth: 1, borderRightColor: Colors.border, padding: Spacing.xl },
  rightPane: { flex: 1, backgroundColor: Colors.background },
  navList: { gap: Spacing.sm },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, gap: Spacing.md },
  navItemActive: { backgroundColor: Colors.primary + '12' },
  navItemText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  navItemTextActive: { color: Colors.primary, fontWeight: '700' },
  sectionWrap: { padding: Spacing.xl },
  detailScroll: { paddingBottom: 100 },
});
