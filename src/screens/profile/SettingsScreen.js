import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [incognito, setIncognito] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Loviq?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: () => navigation.replace('Onboarding', { screen: 'Welcome' }) }
      ]
    );
  };

  const handleBlockList = () => {
    Alert.alert("Block List", "Block list settings will be added here.");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account Settings */}
        <Text style={styles.groupTitle}>Account Settings</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <Text style={styles.itemLabel}>Phone Number</Text>
            <Text style={styles.itemVal}>(555) 019-2834</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.itemLabel}>Email</Text>
            <Text style={styles.itemVal}>alex@example.com</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.groupTitle}>Notifications</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <Text style={styles.itemLabel}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <Text style={styles.groupTitle}>Privacy Settings</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <Text style={styles.itemLabel}>Show Active Status</Text>
            <Switch
              value={showActive}
              onValueChange={setShowActive}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.itemLabel}>Incognito Mode (Premium)</Text>
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
              trackColor={{ true: Colors.primary }}
            />
          </View>
          <TouchableOpacity style={styles.settingItem} onPress={handleBlockList}>
            <Text style={styles.itemLabel}>Blocked Contacts</Text>
            <Text style={styles.itemVal}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => Alert.alert('Delete Account', 'This will delete your account permanently.')}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  settingGroup: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  itemLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemVal: { fontSize: 14, color: Colors.textMuted },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl },
  logoutText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  deleteButton: { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  deleteText: { color: Colors.error, fontSize: Typography.fontSize.sm, textDecorationLine: 'underline' },
});
