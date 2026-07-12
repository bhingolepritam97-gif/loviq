import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import OnboardingHeader from '../../components/OnboardingHeader';

const { width } = Dimensions.get('window');
const STEPS_TOTAL = 12;

export default function NameScreen({ navigation }) {
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();

  const isValid = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={4}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 1 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What’s your name?</Text>
          <Text style={styles.subtitle}>This is how it’ll appear on your profile.</Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Input
            placeholder="First Name"
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoFocus
            autoCapitalize="words"
          />
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        {isValid && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Ready to meet?</Text>
          </View>
        )}
        <Button
          label="Continue →"
          onPress={() => navigation.navigate('Birthday', { name: name.trim() })}
          disabled={!isValid}
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
  inputSection: { marginBottom: Spacing.xl },
  accentImage: {
    width: '75%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
    transform: [{ rotate: '2deg' }],
  },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, alignItems: 'center' },
  hintContainer: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
