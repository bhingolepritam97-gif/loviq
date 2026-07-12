import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function ChatOptionsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = route.params || {};

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch",
      `Are you sure you want to unmatch with ${profile?.name || 'this user'}? You won't be able to message them again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unmatch", style: "destructive", onPress: () => navigation.navigate('Inbox') }
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      "Report User",
      "Please select a reason for reporting this profile.",
      [
        { text: "Inappropriate Messages", onPress: () => confirmReport() },
        { text: "Fake Profile", onPress: () => confirmReport() },
        { text: "Other", onPress: () => confirmReport() },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const confirmReport = () => {
    Alert.alert("Report Received", "Thank you for keeping Loviq safe. Our moderation team will review this profile.");
    navigation.navigate('Inbox');
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${profile?.name || 'this user'}? they will not see your profile or be able to match again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => navigation.navigate('Inbox') }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Options</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {/* Profile Card Option */}
        <TouchableOpacity 
          style={styles.profileItem}
          onPress={() => navigation.navigate('DiscoverFlow', { screen: 'ProfileDetail', params: { profile } })}
        >
          <Text style={styles.itemLabel}>View Profile Details</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Safety Options */}
        <TouchableOpacity style={styles.optionItem} onPress={handleUnmatch}>
          <Text style={styles.optionLabel}>Unmatch with {profile?.name}</Text>
          <Text style={styles.subLabel}>Remove this match from your chat list</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
          <Text style={[styles.optionLabel, styles.dangerText]}>Block {profile?.name}</Text>
          <Text style={styles.subLabel}>Hide your profile and prevent future matches</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
          <Text style={[styles.optionLabel, styles.dangerText]}>Report {profile?.name}</Text>
          <Text style={styles.subLabel}>Flag this profile to Loviq safety team</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  content: { padding: Spacing.xl },
  profileItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  itemLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  arrow: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1.5, backgroundColor: Colors.border, marginVertical: Spacing.xl },
  optionItem: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.md },
  optionLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  dangerText: { color: Colors.error },
  subLabel: { fontSize: 13, color: Colors.textMuted, marginTop: Spacing.xs },
});
