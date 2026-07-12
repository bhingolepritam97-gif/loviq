import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;

export default function BirthdayScreen({ route, navigation }) {
  const { name } = route.params || { name: 'User' };
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

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
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={5}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 2 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

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
              style={styles.input}
              placeholder="DD"
              value={day}
              onChangeText={handleDayChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Month */}
          <View style={styles.fieldCol}>
            <Text style={styles.label}>MONTH</Text>
            <TextInput
              ref={monthRef}
              style={styles.input}
              placeholder="MM"
              value={month}
              onChangeText={handleMonthChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Year */}
          <View style={styles.fieldCol}>
            <Text style={styles.label}>YEAR</Text>
            <TextInput
              ref={yearRef}
              style={styles.input}
              placeholder="YYYY"
              value={year}
              onChangeText={handleYearChange}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Live Age Display */}
        {calculatedAge !== null && (
          <View style={[styles.ageContainer, isValidAge ? styles.ageContainerValid : styles.ageContainerInvalid]}>
            <Text style={styles.ageLabel}>CALCULATED AGE</Text>
            <Text style={styles.ageVal}>{calculatedAge} 🎂</Text>
            {!isValidAge && (
              <Text style={styles.ageError}>You must be 18 or older to join Loviq</Text>
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
  grid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['3xl'] },
  fieldCol: { flex: 1, gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.textMuted, textAlign: 'center', letterSpacing: 1 },
  input: {
    height: 60,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  ageContainer: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageContainerValid: {
    backgroundColor: Colors.primary + '06',
    borderColor: Colors.primary + '20',
  },
  ageContainerInvalid: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error + '25',
  },
  ageLabel: { fontSize: Typography.fontSize.xs, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5, marginBottom: Spacing.xs },
  ageVal: { fontSize: Typography.fontSize['5xl'], fontWeight: '800', color: Colors.primary },
  ageError: { color: Colors.error, fontSize: Typography.fontSize.sm, fontWeight: '600', marginTop: Spacing.sm },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
