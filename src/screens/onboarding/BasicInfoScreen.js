import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProgressBar from '../../components/ProgressBar';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';

const GENDERS = ['Woman', 'Man', 'Non-binary'];

export default function BasicInfoScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('basic_info');
  }, []);

  const isValid = name.trim().length > 0 && birthday && gender;

  const handleContinue = () => {
    trackOnboardingStepCompleted('basic_info', Date.now() - startTime.current);
    navigation.navigate('Preferences', {
      ...route.params,
      name: name.trim(),
      birthday: birthday.toISOString(),
      gender,
    });
  };

  const age = birthday
    ? Math.floor((Date.now() - birthday.getTime()) / 3.15576e10)
    : null;

  return (
    <View style={styles.container}>
      <ProgressBar progress={1} totalSteps={4} />
      <Text style={styles.title}>The basics</Text>

      <TextInput
        style={styles.input}
        placeholder="First name"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={birthday ? styles.inputText : styles.placeholderText}>
          {birthday
            ? `${birthday.toLocaleDateString()} (${age})`
            : 'Birthday'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthday || new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setBirthday(selectedDate);
          }}
        />
      )}
      {age !== null && age < 18 && (
        <Text style={styles.errorText}>You must be 18+ to use Vela.</Text>
      )}

      <Text style={styles.label}>I am a</Text>
      <View style={styles.pillRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, gender === g && styles.pillSelected]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.pillText, gender === g && styles.pillTextSelected]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
        disabled={!isValid || (age !== null && age < 18)}
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
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 16, justifyContent: 'center',
  },
  inputText: { fontSize: 16, color: '#000' },
  placeholderText: { fontSize: 16, color: '#999' },
  errorText: { color: '#e74c3c', marginBottom: 12, fontSize: 13 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  pillSelected: { backgroundColor: '#FF4667', borderColor: '#FF4667' },
  pillText: { color: '#333', fontSize: 14 },
  pillTextSelected: { color: '#fff', fontWeight: '600' },
  continueButton: {
    backgroundColor: '#FF4667', borderRadius: 28, padding: 18,
    alignItems: 'center', marginTop: 'auto',
  },
  continueButtonDisabled: { backgroundColor: '#ccc' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
