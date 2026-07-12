import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import { ALL_INTERESTS } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';

const GENDERS = ['Women', 'Men', 'Everyone'];

export default function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useAuth();
  const [gender, setGender] = useState(profile?.interestedIn || 'Women');
  const [distance, setDistance] = useState(profile?.distance_range || 25);
  const [ageRange, setAgeRange] = useState(profile?.age_range || [20, 35]);
  const [selectedInterests, setSelectedInterests] = useState(profile?.interests || ['Coffee', 'Hiking']);

  const handleApply = () => {
    if (profile) {
      setProfile({
        ...profile,
        interestedIn: gender,
        distance_range: distance,
        age_range: ageRange,
        interests: selectedInterests
      });
    }
    navigation.goBack();
  };

  const handleReset = () => {
    setGender('Everyone');
    setDistance(100);
    setAgeRange([18, 60]);
    setSelectedInterests([]);
  };

  const toggleInterest = (label) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Show me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Show Me</Text>
          <View style={styles.genderRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Distance */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
            <Text style={styles.valueText}>{distance} miles</Text>
          </View>
          {/* Simple Mock Slider buttons for mock experience */}
          <View style={styles.sliderMock}>
            {[10, 25, 50, 100].map(dist => (
              <TouchableOpacity
                key={dist}
                style={[styles.sliderOption, distance === dist && styles.sliderOptionActive]}
                onPress={() => setDistance(dist)}
              >
                <Text style={[styles.sliderText, distance === dist && styles.sliderTextActive]}>{dist}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <Text style={styles.valueText}>{ageRange[0]} - {ageRange[1]}</Text>
          </View>
          <View style={styles.sliderMock}>
            {[[18, 25], [20, 35], [25, 45], [30, 60]].map(([min, max]) => (
              <TouchableOpacity
                key={min}
                style={[styles.sliderOption, ageRange[0] === min && styles.sliderOptionActive]}
                onPress={() => setAgeRange([min, max])}
              >
                <Text style={[styles.sliderText, ageRange[0] === min && styles.sliderTextActive]}>{min}-{max}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter by interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Interests</Text>
          <View style={styles.chips}>
            {ALL_INTERESTS.slice(0, 15).map(interest => (
              <Chip
                key={interest.id}
                label={interest.label}
                emoji={interest.emoji}
                selected={selectedInterests.includes(interest.label)}
                onPress={() => toggleInterest(interest.label)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Apply Filters" onPress={handleApply} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  resetText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  valueText: { fontSize: Typography.fontSize.md, fontWeight: '600', color: Colors.primary },
  genderRow: { flexDirection: 'row', gap: Spacing.md },
  genderButton: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  genderButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  genderText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textMuted },
  genderTextActive: { color: Colors.primary },
  sliderMock: { flexDirection: 'row', gap: Spacing.sm },
  sliderOption: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  sliderOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  sliderText: { fontSize: 13, color: Colors.textMuted },
  sliderTextActive: { color: Colors.primary, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, backgroundColor: Colors.background },
});
