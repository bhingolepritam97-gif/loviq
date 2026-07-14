import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import ProgressBar from '../../components/ProgressBar';

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
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, marginTop: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  pillSelected: { backgroundColor: '#FF4667', borderColor: '#FF4667' },
  pillText: { color: '#333', fontSize: 14 },
  pillTextSelected: { color: '#fff', fontWeight: '600' },
  cardColumn: { gap: 10, marginBottom: 8 },
  card: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 14, padding: 16,
  },
  cardSelected: { borderColor: '#FF4667', backgroundColor: '#FFF1F3' },
  cardText: { fontSize: 15, color: '#333' },
  cardTextSelected: { color: '#FF4667', fontWeight: '600' },
  hint: { fontSize: 12, color: '#999', marginBottom: 24 },
  continueButton: {
    backgroundColor: '#FF4667', borderRadius: 28, padding: 18,
    alignItems: 'center', marginTop: 'auto',
  },
  continueButtonDisabled: { backgroundColor: '#ccc' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
