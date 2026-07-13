import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 13;

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
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={6}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
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
              <TouchableOpacity 
                key={opt.id} 
                style={styles.option} 
                onPress={() => toggle(opt.id)} 
                activeOpacity={0.85}
              >
                {isSelected ? (
                  <LinearGradient 
                    colors={['#FF3A5C', '#FF6B35']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    style={styles.optionInner}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, styles.optionLabelSelected]}>{opt.label}</Text>
                    <View style={styles.checkmark}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
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
        <Button 
          label="Continue →" 
          onPress={() => navigation.navigate('DatingIntent', { name, birthday, age, gender, showGender, interestedIn: selected })} 
          disabled={selected.length === 0} 
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
    paddingBottom: Spacing.xl 
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
  optionsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: Spacing.base, 
    justifyContent: 'center', 
    marginBottom: Spacing.xl 
  },
  option: { 
    width: '47%' 
  },
  optionInner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    backgroundColor: '#F8F9FA',
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  optionUnselected: {
    borderColor: '#EAEAEA',
    backgroundColor: '#F8F9FA',
  },
  optionEmoji: { 
    fontSize: 36, 
    marginBottom: Spacing.sm 
  },
  optionLabel: { 
    fontSize: Typography.fontSize.base, 
    fontWeight: '700', 
    color: '#0D0D1A' 
  },
  optionLabelSelected: { 
    color: '#FFFFFF' 
  },
  checkmark: { 
    position: 'absolute', 
    top: Spacing.sm, 
    right: Spacing.sm, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    borderRadius: Radius.full, 
    width: 22, 
    height: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  checkText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '800' 
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
});
