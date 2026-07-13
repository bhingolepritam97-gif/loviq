import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';
import { LinearGradient } from 'expo-linear-gradient';

const STEPS_TOTAL = 13;
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
  const [inputFocused, setInputFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const handlePrompt = (prompt) => {
    setActivePrompt(prompt);
    if (bio.trim() === '' || (activePrompt && bio.trim() === activePrompt.trim())) {
      setBio(prompt + ' ');
    }
  };

  const isPromptOnly = activePrompt && bio.trim() === activePrompt.trim();
  const isValid = bio.trim().length >= 10 && !isPromptOnly;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={9}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>Write a short bio — or use a prompt below to get inspired.</Text>

        {/* Prompt chips */}
        <Text style={styles.sectionLabel}>Quick prompts ⚡</Text>
        <View style={styles.promptsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.prompts}
            contentContainerStyle={{ paddingRight: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm }}
          >
            {PROMPTS.map(p => (
              <TouchableOpacity 
                key={p} 
                style={[
                  styles.promptChip, 
                  activePrompt === p ? styles.promptChipActive : styles.promptChipInactive
                ]} 
                onPress={() => handlePrompt(p)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.promptChipText, 
                  activePrompt === p ? styles.promptChipTextActive : styles.promptChipTextInactive
                ]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bio input */}
        <View style={[
          styles.inputWrap,
          inputFocused && styles.inputWrapFocused,
          bio.length > 0 && styles.inputWrapFilled
        ]}>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people what makes you unique…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={MAX_CHARS}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <Text style={[styles.charCount, bio.length > MAX_CHARS * 0.9 && styles.charCountWarn]}>
            {bio.length}/{MAX_CHARS}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button 
          label="Continue →" 
          onPress={() => navigation.navigate('PhotoUpload', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio })} 
          disabled={!isValid} 
        />
        <TouchableOpacity 
          style={styles.skipBtn} 
          onPress={() => navigation.navigate('PhotoUpload', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio: '' })}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
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
    paddingBottom: Spacing['4xl'] 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#0D0D1A', 
    marginBottom: Spacing.sm, 
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: { 
    fontSize: Typography.fontSize.base, 
    color: Colors.textMuted, 
    lineHeight: 24, 
    marginBottom: Spacing['2xl'] 
  },
  sectionLabel: { 
    fontSize: Typography.fontSize.sm, 
    fontWeight: '700', 
    color: '#0D0D1A', 
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  promptsContainer: {
    marginLeft: -Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  prompts: { 
    paddingLeft: Spacing['2xl'],
    flexDirection: 'row', 
    flexGrow: 0 
  },
  promptChip: { 
    paddingVertical: Spacing.sm, 
    paddingHorizontal: Spacing.base, 
    borderRadius: Radius.full, 
    borderWidth: 1.5, 
  },
  promptChipInactive: {
    borderColor: '#EAEAEA', 
    backgroundColor: '#F8F9FA'
  },
  promptChipActive: { 
    borderColor: '#E91E8C', 
    backgroundColor: '#FFF9FB' 
  },
  promptChipText: { 
    fontSize: Typography.fontSize.xs, 
    fontWeight: '700' 
  },
  promptChipTextInactive: {
    color: Colors.textMuted 
  },
  promptChipTextActive: { 
    color: '#E91E8C' 
  },
  inputWrap: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    backgroundColor: '#F8F9FA',
    padding: Spacing.base,
    minHeight: 160,
  },
  inputWrapFocused: {
    borderColor: '#E91E8C',
    backgroundColor: '#FFF5F8',
  },
  inputWrapFilled: {
    borderColor: 'rgba(233, 30, 140, 0.4)',
    backgroundColor: '#FFF9FB',
  },
  input: { 
    flex: 1, 
    fontSize: Typography.fontSize.base, 
    color: '#0D0D1A', 
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  charCount: { 
    textAlign: 'right', 
    fontSize: Typography.fontSize.xs, 
    color: Colors.textMuted, 
    marginTop: Spacing.sm 
  },
  charCountWarn: { 
    color: '#FF3B30', 
    fontWeight: '600' 
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md, 
    gap: Spacing.xs,
    backgroundColor: 'transparent',
  },
  skipBtn: { 
    alignItems: 'center', 
    paddingVertical: Spacing.sm 
  },
  skipText: { 
    color: Colors.textMuted, 
    fontSize: Typography.fontSize.sm, 
    fontWeight: '600',
    textDecorationLine: 'underline' 
  },
});
