import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

const INTEREST_OPTIONS = [
  'Travel', 'Fitness', 'Music', 'Foodie', 'Movies', 'Reading',
  'Gaming', 'Art', 'Hiking', 'Dogs', 'Cats', 'Coffee',
  'Yoga', 'Photography', 'Cooking', 'Dancing', 'Wine', 'Sports',
];

const MIN_SELECTIONS = 3;

export default function InterestsScreen({ navigation, route }) {
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const startTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('interests');
  }, []);

  const toggle = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const isValid = selected.length >= MIN_SELECTIONS;

  const handleContinue = () => {
    trackOnboardingStepCompleted('interests', Date.now() - startTime.current);
    navigation.navigate('PhotoUpload', {
      ...route.params,
      interests: selected,
    });
  };

  const filteredOptions = INTEREST_OPTIONS.filter((interest) =>
    interest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ProgressBar progress={3} totalSteps={4} />
      <Text style={styles.title}>What are you into?</Text>
      <Text style={styles.subtitle}>Pick at least {MIN_SELECTIONS} - this helps us match you well.</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search interests..."
        placeholderTextColor={Colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        selectionColor={Colors.primary}
      />

      <ScrollView contentContainerStyle={styles.pillWrap} showsVerticalScrollIndicator={false}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => toggle(interest)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noResultsText}>No interests found matching "{searchQuery}"</Text>
        )}
      </ScrollView>

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
          <Text style={styles.continueButtonText}>
            Continue {selected.length > 0 && `(${selected.length})`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, paddingTop: 60, backgroundColor: Colors.background },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 4, marginTop: 16 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius['2xl'],
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 20,
    backgroundColor: Colors.surface,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 16 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  pillSelected: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  pillText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: Colors.primary, fontWeight: '700' },
  noResultsText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    marginVertical: 40,
  },
  continueButton: {
    borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: 12,
  },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  continueGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
