import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { updateUserProfile } from '../../services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();
  const [notifications, setNotifications] = useState(profile?.notificationsEnabled !== false);
  const [showActive, setShowActive] = useState(true);
  const [incognito, setIncognito] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Privacy and Visibility Switches states
  const [hideDistance, setHideDistance] = useState(profile?.hideDistance || false);
  const [paused, setPaused] = useState(profile?.isActive === false);

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
      await WebBrowser.openBrowserAsync('https://velaapp.com/privacy');
    } catch (err) {
      console.warn('Error opening privacy policy:', err);
      Alert.alert('Error', 'Unable to open browser.');
    }
  };

  const handleOpenTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://velaapp.com/terms');
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
      "Are you sure you want to log out of Vela?",
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

  const handleBlockList = () => {
    navigation.navigate('BlockedContacts');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account Settings */}
        <Text style={styles.groupTitle}>Account Settings</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="call-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Phone Number</Text>
            </View>
            <Text style={styles.itemVal}>{auth?.currentUser?.phoneNumber || 'Not set'}</Text>
          </View>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="mail-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Email</Text>
            </View>
            <Text style={styles.itemVal} numberOfLines={1}>{auth?.currentUser?.email || 'Not set'}</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.groupTitle}>Notifications</Text>
        <View style={styles.settingGroup}>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <Text style={styles.groupTitle}>Privacy Settings</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.itemLeft}>
              <Ionicons name="eye-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Show Active Status</Text>
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
          <TouchableOpacity style={styles.settingItem} onPress={handleBlockList}>
            <View style={styles.itemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Blocked Contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Support')}>
            <View style={styles.itemLeft}>
              <Ionicons name="help-circle-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About & Legal */}
        <Text style={styles.groupTitle}>About</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleOpenPrivacy}
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
          >
            <View style={styles.itemLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.text} style={styles.itemIcon} />
              <Text style={styles.itemLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.logoutText}>Log Out</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => Alert.alert(
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
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius['2xl'], paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl, ...Shadow.sm },
  logoutText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  deleteButton: { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  deleteText: { color: Colors.error, fontSize: Typography.fontSize.sm, fontWeight: '600' },
});
