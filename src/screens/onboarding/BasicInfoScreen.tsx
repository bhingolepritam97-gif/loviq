import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const GENDERS = ['Woman', 'Man', 'Non-binary'];

export default function BasicInfoScreen({ navigation, route }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [dobInput, setDobInput] = useState('');
  const [gender, setGender] = useState(null);
  const startTime = useRef(Date.now());

  const formatDob = (val) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    } else if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    }
    return formatted;
  };

  useEffect(() => {
    if (dobInput.length === 10) {
      const parts = dobInput.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day &&
        year > 1900 &&
        year <= new Date().getFullYear()
      ) {
        setBirthday(date);
      } else {
        setBirthday(null);
      }
    } else {
      setBirthday(null);
    }
  }, [dobInput]);

  useEffect(() => {
    trackOnboardingStep('basic_info');
  }, []);

  const age = birthday
    ? Math.floor((Date.now() - birthday.getTime()) / 3.15576e10)
    : null;

  const isValid = name.trim().length > 0 && birthday && gender && (age !== null && age >= 18);

  const handleContinue = () => {
    trackOnboardingStepCompleted('basic_info', Date.now() - startTime.current);
    navigation.navigate('Preferences', {
      ...route.params,
      name: name.trim(),
      birthday: birthday.toISOString(),
      gender,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#130516', '#22082b']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      
      {/* Header — title only, no back button, no progress bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Lovly</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainWrapper}>
            <Text style={styles.title}>The basics</Text>
            <Text style={styles.subtitle}>
              Tell us a little about yourself to help us find your perfect match.
            </Text>

            {/* Input Form */}
            <View style={styles.formContainer}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>FIRST NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#7A667A"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  selectionColor="#E8628F"
                  accessible={true}
                  accessibilityLabel="First name input field"
                  accessibilityHint="Enter your first name to display on your profile."
                />
              </View>

              {/* Birthday */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>BIRTHDAY</Text>
                <View style={styles.dobInputWrapper}>
                  <TextInput
                    style={styles.dobTextInput}
                    placeholder="DD / MM / YYYY"
                    placeholderTextColor="#7A667A"
                    value={dobInput}
                    onChangeText={text => setDobInput(formatDob(text))}
                    keyboardType="number-pad"
                    maxLength={10}
                    selectionColor="#E8628F"
                    accessible={true}
                    accessibilityLabel="Birthday input field"
                    accessibilityHint="Type your birth date in day month year format."
                  />
                  <Ionicons name="calendar-outline" size={20} color="#E8628F" style={styles.calendarIcon} />
                </View>
                {birthday && (
                  <Text style={styles.infoText}>Calculated Age: {age} years old</Text>
                )}
                {dobInput.length === 10 && !birthday && (
                  <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                    Please enter a valid date (DD/MM/YYYY).
                  </Text>
                )}
                {age !== null && age < 18 && (
                  <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                    You must be 18+ to use Lovly.
                  </Text>
                )}
              </View>

              {/* Gender selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>I AM A</Text>
                <View style={styles.pillRow} accessible={false}>
                  {GENDERS.map((g) => {
                    const isSelected = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => setGender(g)}
                        accessible={true}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={`Gender option: ${g}`}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Action Area */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
              disabled={!isValid}
              onPress={handleContinue}
              activeOpacity={isValid ? 0.85 : 1}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue to next onboarding step"
              accessibilityState={{ disabled: !isValid }}
            >
              <LinearGradient
                colors={isValid ? ['#E8628F', '#C53D6B'] : ['#3A1E4A', '#3A1E4A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                <Text style={styles.continueButtonText}>CONTINUE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#130516' 
  },
  headerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8628F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    justifyContent: 'space-between',
  },
  mainWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: '#A592A5',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  formContainer: {
    gap: Spacing.xl,
  },
  inputGroup: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A592A5',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  textInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.base,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  dobInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.base,
  },
  dobTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  calendarIcon: {
    marginLeft: Spacing.sm,
  },
  infoText: {
    color: '#E8628F',
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillSelected: {
    borderColor: '#E8628F',
    backgroundColor: 'rgba(232, 98, 143, 0.12)',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A592A5',
  },
  pillTextSelected: {
    color: '#E8628F',
    fontWeight: '700',
  },
  footer: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.base,
  },
  continueButton: {
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.md,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stepText: {
    fontSize: 12,
    color: '#A592A5',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});
