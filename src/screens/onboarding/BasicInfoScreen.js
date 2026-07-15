import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProgressBar from '../../components/ProgressBar';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

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
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
        selectionColor={Colors.primary}
      />

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(prev => !prev)}
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
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
              if (event.type === 'set' && selectedDate) {
                setBirthday(selectedDate);
              }
            } else {
              if (selectedDate) setBirthday(selectedDate);
            }
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
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius['2xl'],
    padding: 16, fontSize: 16, marginBottom: 16, justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  inputText: { fontSize: 16, color: Colors.text },
  placeholderText: { fontSize: 16, color: Colors.textMuted },
  errorText: { color: Colors.error, marginBottom: 12, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 14, color: Colors.textMuted, marginBottom: 8, marginTop: 8, fontWeight: '600' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  pillSelected: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  pillText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: Colors.primary, fontWeight: '700' },
  continueButton: {
    borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: 'auto',
  },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  continueGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
