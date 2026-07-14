import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import ProgressBar from '../../components/ProgressBar';

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
        placeholder="🔍 Search interests..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />

      <ScrollView contentContainerStyle={styles.pillWrap}>
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
      >
        <Text style={styles.continueButtonText}>
          Continue {selected.length > 0 && `(${selected.length} selected)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4, marginTop: 16 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 16 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  pillSelected: { backgroundColor: '#FF4667', borderColor: '#FF4667' },
  pillText: { color: '#333', fontSize: 14 },
  pillTextSelected: { color: '#fff', fontWeight: '600' },
  noResultsText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    marginVertical: 40,
  },
  continueButton: {
    backgroundColor: '#FF4667', borderRadius: 28, padding: 18,
    alignItems: 'center', marginTop: 12,
  },
  continueButtonDisabled: { backgroundColor: '#ccc' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
