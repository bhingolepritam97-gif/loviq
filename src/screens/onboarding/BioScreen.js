import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;
const MAX_CHARS = 300;
const PROMPTS = [
  "My simple pleasures are…",
  "The way to win me over is…",
  "I'm looking for…",
  "Two truths and a lie…",
];

export default function BioScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender, interestedIn, intent, interests } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true, interestedIn: [], intent: '', interests: [] };
  const [bio, setBio] = useState('');
  const [activePrompt, setActivePrompt] = useState(null);
  const insets = useSafeAreaInsets();

  const handlePrompt = (prompt) => {
    setActivePrompt(prompt);
    setBio(prompt + ' ');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={10}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 6 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>Write a short bio — or use a prompt below to get inspired.</Text>

        {/* Prompt chips */}
        <Text style={styles.sectionLabel}>Quick prompts ⚡</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prompts}>
          {PROMPTS.map(p => (
            <TouchableOpacity key={p} style={[styles.promptChip, activePrompt === p && styles.promptChipActive]} onPress={() => handlePrompt(p)}>
              <Text style={[styles.promptChipText, activePrompt === p && styles.promptChipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bio input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people what makes you unique…"
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={MAX_CHARS}
          />
          <Text style={[styles.charCount, bio.length > MAX_CHARS * 0.9 && styles.charCountWarn]}>
            {bio.length}/{MAX_CHARS}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Continue →" onPress={() => navigation.navigate('PhotoUpload', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio })} disabled={bio.trim().length < 10} />
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('PhotoUpload', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio: '' })}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing['4xl'] },
  backBtn: { marginBottom: Spacing['2xl'] },
  backIcon: { fontSize: 24, color: Colors.text },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Spacing['2xl'] },
  sectionLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  prompts: { marginBottom: Spacing.xl, flexDirection: 'row' },
  promptChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.sm, backgroundColor: Colors.surface },
  promptChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  promptChipText: { fontSize: Typography.fontSize.xs, fontWeight: '600', color: Colors.textMuted },
  promptChipTextActive: { color: Colors.primary },
  inputWrap: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    minHeight: 160,
  },
  input: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.text, lineHeight: 24 },
  charCount: { textAlign: 'right', fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  charCountWarn: { color: Colors.warning },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, gap: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: Typography.fontSize.sm, textDecorationLine: 'underline' },
});
