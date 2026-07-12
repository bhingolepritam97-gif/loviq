import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

export default function LocationPermissionScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio, photos } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true, interestedIn: [], intent: '', interests: [], bio: '', photos: [] };
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE0F0', '#FFF0E8', Colors.background]} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={11}
        totalSteps={12}
        title="Permissions"
        subtitle="Step 5 of 6"
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: Spacing.xl }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationEmoji}>📍</Text>
            <LinearGradient colors={Gradients.primary.colors} start={Gradients.primary.start} end={Gradients.primary.end} style={styles.pulseBg} />
          </View>

          <Text style={styles.title}>Who's nearby?</Text>
          <Text style={styles.subtitle}>
            Loviq uses your location to show you people nearby. We never share your exact location with matches — only approximate distance.
          </Text>

          <View style={styles.benefitsList}>
            {[
              { icon: '🎯', text: 'Find matches within miles — not continents' },
              { icon: '🔒', text: 'Exact address is never shared or stored' },
              { icon: '⚡', text: 'Turn off or adjust range at any time' },
            ].map(b => (
              <View key={b.text} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Allow Location" onPress={() => navigation.navigate('NotificationPermission', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio, photos })} />
        <Button label="Not Now" variant="ghost" onPress={() => navigation.navigate('NotificationPermission', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio, photos })} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  content: { paddingHorizontal: Spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  illustration: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'], position: 'relative' },
  illustrationEmoji: { fontSize: 56, zIndex: 1 },
  pulseBg: { position: 'absolute', width: '100%', height: '100%', borderRadius: 60, opacity: 0.2 },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.text, textAlign: 'center', letterSpacing: -0.8, marginBottom: Spacing.base },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
  benefitsList: { alignSelf: 'stretch', gap: Spacing.base },
  benefitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, gap: Spacing.md },
  benefitIcon: { fontSize: 24 },
  benefitText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text, lineHeight: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, backgroundColor: 'transparent' },
});
