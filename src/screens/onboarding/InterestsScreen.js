import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import OnboardingHeader from '../../components/OnboardingHeader';
import { ALL_INTERESTS } from '../../data/constants';
import { LinearGradient } from 'expo-linear-gradient';

const STEPS_TOTAL = 13;
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
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={8}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your interests</Text>
            <Text style={styles.subtitle}>Pick up to {MAX_SELECT} things you love. Your matches will see these.</Text>
          </View>
          <View style={[
            styles.countBadge,
            selected.length >= MAX_SELECT ? styles.countBadgeFull : styles.countBadgeActive
          ]}>
            <Text style={[
              styles.countText,
              selected.length >= MAX_SELECT ? styles.countTextFull : styles.countTextActive
            ]}>
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
                  style={selected.includes(interest.id) ? styles.chipSelectedCustom : styles.chipUnselectedCustom}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button 
          label="Continue →" 
          onPress={() => navigation.navigate('Bio', { name, birthday, age, gender, showGender, interestedIn, intent, interests: selected })} 
          disabled={selected.length < 1} 
        />
      </View>
    </View>
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
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: Spacing.xl 
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
    fontSize: Typography.fontSize.sm, 
    color: Colors.textMuted, 
    lineHeight: 20 
  },
  countBadge: { 
    borderRadius: Radius.xl, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm, 
    marginLeft: Spacing.base, 
    marginTop: Spacing.xs,
    borderWidth: 1,
  },
  countBadgeActive: {
    backgroundColor: '#FFF5F8',
    borderColor: 'rgba(233, 30, 140, 0.25)',
  },
  countBadgeFull: {
    backgroundColor: '#FFF6F2',
    borderColor: 'rgba(255, 107, 53, 0.25)',
  },
  countText: { 
    fontWeight: '800', 
    fontSize: Typography.fontSize.sm 
  },
  countTextActive: {
    color: '#E91E8C',
  },
  countTextFull: { 
    color: '#FF6B35',
  },
  category: { 
    marginBottom: Spacing.lg 
  },
  catLabel: { 
    fontSize: Typography.fontSize.xs, 
    fontWeight: '800', 
    color: Colors.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    marginBottom: Spacing.sm 
  },
  chips: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginLeft: -Spacing.xs 
  },
  chipSelectedCustom: {
    backgroundColor: '#FFF9FB',
    borderColor: '#E91E8C',
    borderWidth: 1.5,
  },
  chipUnselectedCustom: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EAEAEA',
    borderWidth: 1.5,
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
});
