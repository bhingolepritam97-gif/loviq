import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const STEPS_TOTAL = 13;

export default function BirthdayScreen({ route, navigation }) {
  const { name } = route.params || { name: 'User' };
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [dayFocused, setDayFocused] = useState(false);
  const [monthFocused, setMonthFocused] = useState(false);
  const [yearFocused, setYearFocused] = useState(false);

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const insets = useSafeAreaInsets();

  const calculateAge = () => {
    if (!day || !month || !year || year.length < 4) return null;
    
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) return null;

    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const calculatedAge = calculateAge();
  const isValidAge = calculatedAge !== null && calculatedAge >= 18;
  const canContinue = day.length > 0 && month.length > 0 && year.length === 4 && isValidAge;

  const handleDayChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setDay(digits);
    if (digits.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setMonth(digits);
    if (digits.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setYear(digits);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={4}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
      />

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>When were you born, {name}?</Text>
          <Text style={styles.subtitle}>Your age helps us find the most relevant connections. Only your age will be public.</Text>
        </View>

        {/* Picker Grid */}
        <View style={styles.grid}>
          {/* Day */}
          <View style={styles.fieldCol}>
            <Text style={styles.label}>DAY</Text>
            <TextInput
              ref={dayRef}
              style={[
                styles.input,
                dayFocused && styles.inputFocused,
                day.length > 0 && styles.inputFilled,
              ]}
              placeholder="DD"
              value={day}
              onChangeText={handleDayChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              placeholderTextColor={Colors.textMuted}
              onFocus={() => setDayFocused(true)}
              onBlur={() => setDayFocused(false)}
            />
          </View>

          {/* Month */}
          <View style={styles.fieldCol}>
            <Text style={styles.label}>MONTH</Text>
            <TextInput
              ref={monthRef}
              style={[
                styles.input,
                monthFocused && styles.inputFocused,
                month.length > 0 && styles.inputFilled,
              ]}
              placeholder="MM"
              value={month}
              onChangeText={handleMonthChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              placeholderTextColor={Colors.textMuted}
              onFocus={() => setMonthFocused(true)}
              onBlur={() => setMonthFocused(false)}
            />
          </View>

          {/* Year */}
          <View style={styles.fieldCol}>
            <Text style={styles.label}>YEAR</Text>
            <TextInput
              ref={yearRef}
              style={[
                styles.input,
                yearFocused && styles.inputFocused,
                year.length > 0 && styles.inputFilled,
              ]}
              placeholder="YYYY"
              value={year}
              onChangeText={handleYearChange}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
              placeholderTextColor={Colors.textMuted}
              onFocus={() => setYearFocused(true)}
              onBlur={() => setYearFocused(false)}
            />
          </View>
        </View>

        {/* Live Age Display */}
        {calculatedAge !== null && (
          <View style={[styles.ageContainer, isValidAge ? styles.ageContainerValid : styles.ageContainerInvalid]}>
            <View style={styles.ageHeader}>
              <Ionicons 
                name={isValidAge ? "checkmark-circle" : "close-circle"} 
                size={22} 
                color={isValidAge ? '#E91E8C' : '#FF3B30'} 
              />
              <Text style={[styles.ageLabel, { color: isValidAge ? '#E91E8C' : '#FF3B30' }]}>
                {isValidAge ? 'CONFIRMED AGE' : 'INVALID AGE'}
              </Text>
            </View>
            <Text style={[styles.ageVal, { color: isValidAge ? '#E91E8C' : '#FF3B30' }]}>
              {calculatedAge} years old {isValidAge ? '🎉' : '⚠️'}
            </Text>
            {!isValidAge && (
              <Text style={styles.ageError}>You must be 18 or older to join Vela</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button
          label="Continue →"
          onPress={() => navigation.navigate('Gender', { name, birthday: `${month}/${day}/${year}`, age: calculatedAge })}
          disabled={!canContinue}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.xl, 
    paddingBottom: Spacing.xl 
  },
  header: { 
    marginBottom: Spacing['2xl'] 
  },
  title: { 
    fontSize: 30, 
    fontWeight: '800', 
    color: '#0D0D1A', 
    marginBottom: Spacing.sm, 
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { 
    fontSize: Typography.fontSize.base, 
    color: Colors.textMuted, 
    lineHeight: 24 
  },
  grid: { 
    flexDirection: 'row', 
    gap: Spacing.md, 
    marginBottom: Spacing['2xl'] 
  },
  fieldCol: { 
    flex: 1, 
    gap: Spacing.xs 
  },
  label: { 
    fontSize: Typography.fontSize.xs, 
    fontWeight: '700', 
    color: Colors.textMuted, 
    textAlign: 'center', 
    letterSpacing: 1.5 
  },
  input: {
    height: 60,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: Radius.md,
    fontSize: 22,
    fontWeight: '800',
    color: '#0D0D1A',
  },
  inputFocused: {
    borderColor: '#E91E8C',
    backgroundColor: '#FFF5F8',
  },
  inputFilled: {
    borderColor: 'rgba(233, 30, 140, 0.4)',
    backgroundColor: '#FFF9FB',
  },
  ageContainer: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  ageContainerValid: {
    backgroundColor: '#FFF9FB',
    borderColor: 'rgba(233, 30, 140, 0.25)',
  },
  ageContainerInvalid: {
    backgroundColor: '#FFF2F2',
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  ageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  ageLabel: { 
    fontSize: Typography.fontSize.xs, 
    fontWeight: '800', 
    letterSpacing: 1.5 
  },
  ageVal: { 
    fontSize: 32, 
    fontWeight: '800',
  },
  ageError: { 
    color: '#FF3B30', 
    fontSize: Typography.fontSize.sm, 
    fontWeight: '600', 
    marginTop: Spacing.sm 
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
});
