import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const INTERESTED_IN = [
  { key: 'Men', label: 'Men', icon: 'male' },
  { key: 'Women', label: 'Women', icon: 'female' },
  { key: 'Everyone', label: 'Everyone', icon: 'people' },
];

const INTENTS = [
  { key: 'long_term', label: 'Long-term relationship', desc: 'Seeking a meaningful deep connection', icon: 'heart' },
  { key: 'short_term', label: 'Short-term fun', desc: 'Keep it casual and light-hearted', icon: 'flame' },
  { key: 'not_sure', label: 'Still figuring it out', desc: 'Exploring possibilities at my own pace', icon: 'help-circle' },
];

export default function PreferencesScreen({ navigation, route }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const [interestedIn, setInterestedIn] = useState(null);
  const [intent, setIntent] = useState(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('preferences');
  }, []);

  const isValid = interestedIn && intent;

  const handleContinue = () => {
    trackOnboardingStepCompleted('preferences', Date.now() - startTime.current);
    navigation.navigate('Interests', {
      ...route.params,
      interestedIn,
      intent,
    });
  };

  const handleSkip = () => {
    // Navigate using default fallbacks
    trackOnboardingStepCompleted('preferences', Date.now() - startTime.current);
    navigation.navigate('Interests', {
      ...route.params,
      interestedIn: interestedIn || 'Everyone',
      intent: intent || 'not_sure',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#130516', '#22082b']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      
      {/* Header with Wordmark and Progress */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarFill, { width: '66%' }]} />
        </View>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lovly</Text>
          <TouchableOpacity 
            onPress={handleSkip} 
            style={styles.skipBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip preferences"
          >
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          <View style={styles.titleRow}>
            <Text style={styles.titleRegular}>Who are you </Text>
            <Text style={styles.titleItalic}>looking for?</Text>
          </View>

          {/* Show Me Section */}
          <Text style={styles.fieldLabel}>SHOW ME</Text>
          <View style={styles.pillRow}>
            {INTERESTED_IN.map((option) => {
              const isSelected = interestedIn === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setInterestedIn(option.key)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Show me ${option.label}`}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={isSelected ? '#E8628F' : '#A592A5'} 
                    style={styles.pillIcon}
                  />
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Intent Card List */}
          <Text style={styles.fieldLabel}>WHAT ARE YOU LOOKING FOR RIGHT NOW</Text>
          <View style={styles.cardColumn}>
            {INTENTS.map((option) => {
              const isSelected = intent === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setIntent(option.key)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Intent option: ${option.label}`}
                  accessibilityHint={option.desc}
                >
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.cardDesc}>
                      {option.desc}
                    </Text>
                  </View>
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={isSelected ? '#E8628F' : '#7A667A'} 
                    style={styles.cardIcon}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={styles.hint}>
            You can change these preferences anytime in settings.
          </Text>
        </View>

        {/* Bottom Action Area */}
        <View style={styles.footer}>
          {/* Sparkles Floating Assist Icon */}
          <View style={styles.sparkleRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity 
              style={styles.sparkleBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="AI Match Assist"
            >
              <Ionicons name="sparkles" size={18} color="#E8628F" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            disabled={!isValid}
            onPress={handleContinue}
            activeOpacity={isValid ? 0.85 : 1}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Continue to interests step"
            accessibilityState={{ disabled: !isValid }}
          >
            <LinearGradient
              colors={isValid ? ['#E8628F', '#C53D6B'] : ['#3A1E4A', '#3A1E4A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#130516' 
  },
  headerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8628F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    fontWeight: '700',
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  skipText: {
    color: '#E8628F',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    justifyContent: 'space-between',
  },
  mainWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  titleRegular: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
  },
  titleItalic: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E8628F',
    fontFamily: Typography.fontFamily.serif,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A592A5',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillSelected: {
    borderColor: '#E8628F',
    backgroundColor: 'rgba(232, 98, 143, 0.12)',
  },
  pillIcon: {
    marginRight: Spacing.xs,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A592A5',
  },
  pillTextSelected: {
    color: '#E8628F',
    fontWeight: '700',
  },
  cardColumn: {
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardSelected: {
    borderColor: '#E8628F',
    backgroundColor: 'rgba(232, 98, 143, 0.08)',
  },
  cardInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF0F3',
  },
  cardTextSelected: {
    color: '#E8628F',
  },
  cardDesc: {
    fontSize: 12,
    color: '#A592A5',
    marginTop: 4,
  },
  cardIcon: {
    marginLeft: Spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: '#7A667A',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.base,
  },
  sparkleRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.xs,
  },
  sparkleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 98, 143, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.md,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stepText: {
    fontSize: 12,
    color: '#A592A5',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});
