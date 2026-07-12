import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { profile } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: profile?.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{profile?.name || 'User'}, {profile?.age || ''}</Text>
          <Text style={styles.jobText}>📍 New York, NY</Text>
        </View>

        {/* Floating Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionLabel}>Edit Info</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Preferences')}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel}>Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Promo Card */}
        <TouchableOpacity style={styles.promoCard} onPress={() => navigation.navigate('Premium')}>
          <LinearGradient
            colors={Gradients.premium.colors}
            start={Gradients.premium.start}
            end={Gradients.premium.end}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Upgrade to Loviq Gold</Text>
                <Text style={styles.promoSubtitle}>Get unlimited likes, rewind swipes, & more features!</Text>
              </View>
              <Text style={styles.promoArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* App tips or safety cards */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety Tips 🛡️</Text>
          <Text style={styles.safetyText}>Learn how to keep your matches fun and safe.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, alignItems: 'center', paddingBottom: 100 },
  profileCard: { alignItems: 'center', marginBottom: Spacing.xl },
  imageWrap: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', borderWidth: 4, borderColor: Colors.white, ...Shadow.md, marginBottom: Spacing.md },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  name: { fontSize: 28, fontWeight: '800', color: Colors.text },
  jobText: { fontSize: 16, color: Colors.textMuted, marginTop: Spacing.xs },
  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: Spacing.xl, marginBottom: Spacing['2xl'] },
  actionButton: { alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, width: 84, height: 84, justifyContent: 'center', ...Shadow.sm },
  editButton: { borderColor: Colors.primary, borderWidth: 1.5 },
  actionIcon: { fontSize: 24, marginBottom: Spacing.xs },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  promoCard: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.xl, ...Shadow.md },
  promoGradient: { padding: Spacing.xl },
  promoContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  promoEmoji: { fontSize: 32 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  promoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 18 },
  promoArrow: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  safetyCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  safetyTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  safetyText: { fontSize: 14, color: Colors.textMuted },
});
