import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;

const OPTIONS = [
  { id: 'men', label: 'Men', emoji: '👨' },
  { id: 'women', label: 'Women', emoji: '👩' },
  { id: 'everyone', label: 'Everyone', emoji: '🌈' },
  { id: 'nonbinary', label: 'Non-binary', emoji: '⚧️' },
];

export default function InterestedInScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true };
  const [selected, setSelected] = useState([]);
  const insets = useSafeAreaInsets();

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={7}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 4 of 6"
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>I'm interested in...</Text>
        <Text style={styles.subtitle}>Choose all that apply. This helps us find your best matches.</Text>

        <View style={styles.optionsGrid}>
          {OPTIONS.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <TouchableOpacity key={opt.id} style={styles.option} onPress={() => toggle(opt.id)} activeOpacity={0.85}>
                {isSelected ? (
                  <LinearGradient colors={Gradients.primary.colors} start={Gradients.primary.start} end={Gradients.primary.end} style={styles.optionInner}>
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, styles.optionLabelSelected]}>{opt.label}</Text>
                    <View style={styles.checkmark}><Text style={styles.checkText}>✓</Text></View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.optionInner, styles.optionUnselected]}>
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Continue →" onPress={() => navigation.navigate('DatingIntent', { name, birthday, age, gender, showGender, interestedIn: selected })} disabled={selected.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing['2xl'] },
  backIcon: { fontSize: 24, color: Colors.text },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Spacing['3xl'] },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.base, justifyContent: 'center', marginBottom: Spacing.xl },
  option: { width: '46%' },
  optionInner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  optionUnselected: {},
  optionEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  optionLabel: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text },
  optionLabelSelected: { color: Colors.white },
  checkmark: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.full, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
