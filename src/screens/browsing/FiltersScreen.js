import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import { ALL_INTERESTS } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';

const GENDERS = ['Women', 'Men', 'Everyone'];

// ─── Custom Pure JS Single Slider ──────────────────────────────────────────────
const SingleSlider = ({ min, max, value, onChange }) => {
  const [width, setWidth] = useState(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (width === 0) return;
        const locationX = evt.nativeEvent.locationX;
        const percent = Math.max(0, Math.min(1, locationX / width));
        const val = Math.round(min + percent * (max - min));
        onChange(val);
      },
      onPanResponderMove: (evt) => {
        if (width === 0) return;
        const locationX = evt.nativeEvent.locationX;
        const percent = Math.max(0, Math.min(1, locationX / width));
        const val = Math.round(min + percent * (max - min));
        onChange(val);
      },
    })
  ).current;

  const percent = (value - min) / (max - min);

  return (
    <View 
      style={styles.sliderTrackContainer} 
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderTrackBackground} />
      <View style={[styles.sliderTrackActive, { width: `${percent * 100}%` }]} />
      <View style={[styles.sliderThumb, { left: `${percent * 100}%`, transform: [{ translateX: -12 }] }]} />
    </View>
  );
};

// ─── Custom Pure JS Double Slider ──────────────────────────────────────────────
const DoubleSlider = ({ min, max, values, onChange }) => {
  const [width, setWidth] = useState(0);
  const activeThumb = useRef(null); // 'min' | 'max' | null

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (width === 0) return;
        const locationX = evt.nativeEvent.locationX;
        const percent = locationX / width;
        const clickVal = min + percent * (max - min);
        
        const distMin = Math.abs(clickVal - values[0]);
        const distMax = Math.abs(clickVal - values[1]);
        activeThumb.current = distMin < distMax ? 'min' : 'max';
      },
      onPanResponderMove: (evt) => {
        if (width === 0 || !activeThumb.current) return;
        const locationX = evt.nativeEvent.locationX;
        const percent = Math.max(0, Math.min(1, locationX / width));
        const val = Math.round(min + percent * (max - min));
        
        if (activeThumb.current === 'min') {
          const newMin = Math.max(min, Math.min(val, values[1] - 2));
          onChange([newMin, values[1]]);
        } else {
          const newMax = Math.min(max, Math.max(val, values[0] + 2));
          onChange([values[0], newMax]);
        }
      },
      onPanResponderRelease: () => {
        activeThumb.current = null;
      },
    })
  ).current;

  const pctMin = (values[0] - min) / (max - min);
  const pctMax = (values[1] - min) / (max - min);

  return (
    <View 
      style={styles.sliderTrackContainer} 
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderTrackBackground} />
      <View style={[styles.sliderTrackActiveRange, { left: `${pctMin * 100}%`, right: `${(1 - pctMax) * 100}%` }]} />
      <View style={[styles.sliderThumb, { left: `${pctMin * 100}%`, transform: [{ translateX: -12 }] }]} />
      <View style={[styles.sliderThumb, { left: `${pctMax * 100}%`, transform: [{ translateX: -12 }] }]} />
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
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
    setDistance(50);
    setAgeRange([18, 50]);
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
          <SingleSlider min={5} max={100} value={distance} onChange={setDistance} />
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <Text style={styles.valueText}>{ageRange[0]} - {ageRange[1]}</Text>
          </View>
          <DoubleSlider min={18} max={65} values={ageRange} onChange={setAgeRange} />
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, backgroundColor: Colors.background },

  // Slider Styles
  sliderTrackContainer: { height: 40, justifyContent: 'center', marginVertical: Spacing.sm, position: 'relative' },
  sliderTrackBackground: { height: 6, borderRadius: 3, backgroundColor: Colors.border },
  sliderTrackActive: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  sliderTrackActiveRange: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  sliderThumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary, ...Shadow.sm }
});
