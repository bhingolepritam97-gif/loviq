import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';;
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import OnboardingHeader from '../../components/OnboardingHeader';
import { ALL_INTERESTS } from '../../data/constants';

const STEPS_TOTAL = 12;
const MAX_SELECT = 7;

export default function InterestsScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender, interestedIn, intent } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true, interestedIn: [], intent: '' };
  const [selected, setSelected] = useState([]);
  const insets = useSafeAreaInsets();

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_SELECT ? [...prev, id] : prev
    );
  };

  const categories = [...new Set(ALL_INTERESTS.map(i => i.category))];

  return (
    <View style={styles.container}>
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={9}
        totalSteps={STEPS_TOTAL}
        title="Build Profile"
        subtitle="Step 6 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your interests</Text>
            <Text style={styles.subtitle}>Pick up to {MAX_SELECT} things you love. Your matches will see these.</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={[styles.countText, selected.length >= MAX_SELECT && styles.countFull]}>
              {selected.length}/{MAX_SELECT}
            </Text>
          </View>
        </View>

        {categories.map(cat => (
          <View key={cat} style={styles.category}>
            <Text style={styles.catLabel}>{cat}</Text>
            <View style={styles.chips}>
              {ALL_INTERESTS.filter(i => i.category === cat).map(interest => (
                <Chip
                  key={interest.id}
                  label={interest.label}
                  emoji={interest.emoji}
                  selected={selected.includes(interest.id)}
                  onPress={() => toggle(interest.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Continue →" onPress={() => navigation.navigate('Bio', { name, birthday, age, gender, showGender, interestedIn, intent, interests: selected })} disabled={selected.length < 1} />
      </View>
    </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing['2xl'] },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, letterSpacing: -0.8, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  countBadge: { backgroundColor: Colors.primary + '15', borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginLeft: Spacing.base, marginTop: Spacing.xs },
  countText: { fontWeight: '700', color: Colors.primary, fontSize: Typography.fontSize.sm },
  countFull: { color: Colors.secondary },
  category: { marginBottom: Spacing.xl },
  catLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: -Spacing.xs },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
