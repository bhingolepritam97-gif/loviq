import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;
const GENDERS = ['Man', 'Woman', 'Non-binary', 'Transgender'];

export default function GenderScreen({ route, navigation }) {
  const { name, birthday, age } = route.params || { name: 'User', birthday: '', age: 18 };
  const [selectedGender, setSelectedGender] = useState('');
  const [showGender, setShowGender] = useState(true);
  const insets = useSafeAreaInsets();

  const canContinue = selectedGender !== '';

  return (
    <View style={styles.container}>
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={6}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 3 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How do you identify?</Text>
          <Text style={styles.subtitle}>Select the gender that best describes you. This helps us find the most relevant connections.</Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsList}>
          {GENDERS.map((gender) => {
            const isSelected = selectedGender === gender;
            return (
              <TouchableOpacity
                key={gender}
                style={styles.optionBtn}
                onPress={() => setSelectedGender(gender)}
                activeOpacity={0.85}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#E91E8C', '#FF6B35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.optionGradient}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>{gender}</Text>
                    <Text style={styles.checkIcon}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.optionInner}>
                    <Text style={styles.optionText}>{gender}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show On Profile Toggle Card */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Show my gender on my profile</Text>
            <Text style={styles.toggleSubtitle}>Visible to other members</Text>
          </View>
          <Switch
            value={showGender}
            onValueChange={setShowGender}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === 'android' ? Colors.white : undefined}
          />
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button
          label="Continue →"
          onPress={() => navigation.navigate('InterestedIn', { name, birthday, age, gender: selectedGender, showGender })}
          disabled={!canContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing['2xl'], alignSelf: 'flex-start' },
  backIcon: { fontSize: 24, color: Colors.text },
  header: { marginBottom: Spacing['2xl'] },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.sm, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24 },
  optionsList: { gap: Spacing.md, marginBottom: Spacing.xl },
  optionBtn: {
    height: 60,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  optionInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  optionText: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  optionTextSelected: { color: Colors.white },
  checkIcon: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
  },
  toggleTextContainer: { flex: 1, marginRight: Spacing.md },
  toggleTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  toggleSubtitle: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
