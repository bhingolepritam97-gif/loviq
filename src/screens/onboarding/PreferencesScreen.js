import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

const INTERESTED_IN = ['Men', 'Women', 'Everyone'];
const INTENTS = [
  { key: 'long_term', label: 'Long-term relationship' },
  { key: 'short_term', label: 'Short-term fun' },
  { key: 'not_sure', label: 'Still figuring it out' },
];

export default function PreferencesScreen({ navigation, route }) {
  const [interestedIn, setInterestedIn] = useState(null);
  const [intent, setIntent] = useState(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('preferences');
  }, []);

  const isValid = interestedIn && intent;

  const handleContinue = () => {
    trackOnboardingStepCompleted('preferences', Date.now() - startTime.current);
    navigation.navigate('Interests', {
      ...route.params,
      interestedIn,
      intent,
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar progress={2} totalSteps={4} />
      <Text style={styles.title}>Who are you looking for?</Text>

      <Text style={styles.label}>Show me</Text>
      <View style={styles.pillRow}>
        {INTERESTED_IN.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, interestedIn === option && styles.pillSelected]}
            onPress={() => setInterestedIn(option)}
          >
            <Text style={[styles.pillText, interestedIn === option && styles.pillTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>What are you looking for right now</Text>
      <View style={styles.cardColumn}>
        {INTENTS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.card, intent === option.key && styles.cardSelected]}
            onPress={() => setIntent(option.key)}
          >
            <Text style={[styles.cardText, intent === option.key && styles.cardTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>You can change this anytime in settings.</Text>

      <TouchableOpacity
        style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
        disabled={!isValid}
        onPress={handleContinue}
        activeOpacity={isValid ? 0.85 : 1}
      >
        <LinearGradient
          colors={isValid ? Gradients.primary.colors : [Colors.border, Colors.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueGradient}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, paddingTop: 60, backgroundColor: Colors.background },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 24, marginTop: 16 },
  label: { fontSize: 14, color: Colors.textMuted, marginBottom: 8, marginTop: 8, fontWeight: '600' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  pillSelected: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  pillText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: Colors.primary, fontWeight: '700' },
  cardColumn: { gap: 10, marginBottom: 8 },
  card: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16, backgroundColor: Colors.surface,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0B' },
  cardText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  cardTextSelected: { color: Colors.primary, fontWeight: '700' },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 24 },
  continueButton: {
    borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: 'auto',
  },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  continueGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
