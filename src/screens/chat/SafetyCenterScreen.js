import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Typography, Spacing, Radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { unmatchUser } from '../../services/UserService';

export default function SafetyCenterScreen({ route, navigation }) {
  const { matchId, matchName, matchProfileId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleUnmatch = () => {
    Alert.alert(
      `Unmatch ${matchName}?`,
      `They will disappear from your matches and you will no longer be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            const success = await unmatchUser(user?.uid, matchProfileId);
            if (success) {
              Alert.alert('Unmatched', `You have unmatched with ${matchName}.`);
              navigation.navigate('Main');
            } else {
              Alert.alert('Error', 'Failed to unmatch. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    navigation.navigate('ReportUser', { matchId, matchName, matchProfileId });
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency SOS',
      'This feature will quietly share your location with your trusted contacts and local authorities if enabled. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SOS', style: 'destructive', onPress: () => Alert.alert('SOS Triggered (Mock)') }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
          <Text style={styles.infoTitle}>Your Safety Matters</Text>
          <Text style={styles.infoDesc}>
            Vela is committed to maintaining a safe, respectful environment. Use the tools below to protect yourself.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Actions against {matchName}</Text>
        
        <TouchableOpacity style={styles.actionRow} onPress={handleUnmatch}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="person-remove" size={24} color={Colors.error} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Unmatch</Text>
            <Text style={styles.actionSubtitle}>Remove this connection privately.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.border} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleReport}>
          <View style={[styles.actionIconWrap, { backgroundColor: Colors.error + '20' }]}>
            <Ionicons name="warning" size={24} color={Colors.error} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Report & Unmatch</Text>
            <Text style={styles.actionSubtitle}>Report bad behavior securely.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.border} />
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>In-Person Tools</Text>

        <TouchableOpacity style={styles.actionRow} onPress={handleEmergency}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#FFD70030' }]}>
            <Ionicons name="alert-circle" size={24} color="#B8860B" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>"Are you OK?" Check-in</Text>
            <Text style={styles.actionSubtitle}>Discrete emergency tools for dates.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.border} />
        </TouchableOpacity>

        {/* Safe Dating Guide Section */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Dating Safety Guidelines</Text>
        
        <View style={styles.tipCard}>
          <Ionicons name="videocam-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Video Chat First</Text>
            <Text style={styles.tipDesc}>Set up a quick voice or video call before meeting in person. It's a safe way to verify authenticity and build trust.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="cafe-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Meet in Public Places</Text>
            <Text style={styles.tipDesc}>Always coordinate your first few dates in busy, crowded locations (cafes, restaurants) and never meet at a private residence.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="car-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Control Your Transport</Text>
            <Text style={styles.tipDesc}>Arrive and leave on your own terms. Avoid ride-sharing or letting your date pick you up from home on date one.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Share Date Details</Text>
            <Text style={styles.tipDesc}>Tell a trusted friend or family member where you are going, who you are meeting, and your expected return time.</Text>
          </View>
        </View>

        <View style={[styles.tipCard, { marginBottom: Spacing.xl }]}>
          <Ionicons name="wine-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Watch Your Drinks</Text>
            <Text style={styles.tipDesc}>Never leave your food or beverage unattended. If it's out of your sight for any reason, order a fresh one.</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  scroll: { padding: Spacing.xl },
  infoCard: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: Radius.xl, alignItems: 'center', marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  infoTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  infoDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  sectionHeader: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginLeft: Spacing.xs },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  actionSubtitle: { fontSize: 13, color: Colors.textMuted },
  
  tipCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  tipIcon: { marginRight: Spacing.md, marginTop: 2 },
  tipTextWrap: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  tipDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});
