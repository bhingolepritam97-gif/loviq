import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingHeader from '../../components/OnboardingHeader';
import { Ionicons } from '@expo/vector-icons';

const STEPS_TOTAL = 13;
const GENDERS = ['Man', 'Woman', 'Non-binary', 'Transgender'];

export default function GenderScreen({ route, navigation }) {
  const { name, birthday, age } = route.params || { name: 'User', birthday: '', age: 18 };
  const [selectedGender, setSelectedGender] = useState('');
  const [showGender, setShowGender] = useState(true);
  const insets = useSafeAreaInsets();

  const canContinue = selectedGender !== '';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={5}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How do you identify?</Text>
          <Text style={styles.subtitle}>Select the gender that best describes you. This helps us find the most relevant connections.</Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsList}>
          {GENDERS.map((gender) => {
            const isSelected = selectedGender === gender;
            return (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.optionBtn,
                  isSelected ? styles.optionBtnSelected : styles.optionBtnUnselected
                ]}
                onPress={() => setSelectedGender(gender)}
                activeOpacity={0.85}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#FF3A5C', '#FF6B35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.optionGradient}
                  >
                    <Text style={[styles.optionText, styles.optionTextSelected]}>{gender}</Text>
                    <Text style={styles.checkIcon}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.optionInner}>
                    <Text style={styles.optionText}>{gender}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show On Profile Toggle Card */}
        <View style={[styles.toggleCard, showGender ? styles.toggleCardActive : styles.toggleCardInactive]}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Show my gender on my profile</Text>
            <Text style={styles.toggleSubtitle}>Visible to other members in the community</Text>
          </View>
          <Switch
            value={showGender}
            onValueChange={setShowGender}
            trackColor={{ false: '#EAEAEA', true: '#E91E8C' }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          />
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button
          label="Continue →"
          onPress={() => navigation.navigate('InterestedIn', { name, birthday, age, gender: selectedGender, showGender })}
          disabled={!canContinue}
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
  header: { 
    marginBottom: Spacing['2xl'] 
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
    lineHeight: 24 
  },
  optionsList: { 
    gap: Spacing.md, 
    marginBottom: Spacing.xl 
  },
  optionBtn: {
    height: 60,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  optionBtnUnselected: {
    borderColor: '#EAEAEA',
    backgroundColor: '#F8F9FA',
  },
  optionBtnSelected: {
    borderColor: '#FF3A5C',
  },
  optionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  optionInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  optionText: { 
    fontSize: Typography.fontSize.lg, 
    fontWeight: '700', 
    color: '#0D0D1A' 
  },
  optionTextSelected: { 
    color: '#FFFFFF' 
  },
  checkIcon: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginTop: Spacing.lg,
  },
  toggleCardActive: {
    backgroundColor: '#FFF9FB',
    borderColor: 'rgba(233, 30, 140, 0.25)',
  },
  toggleCardInactive: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EAEAEA',
  },
  toggleTextContainer: { 
    flex: 1, 
    marginRight: Spacing.md 
  },
  toggleTitle: { 
    fontSize: Typography.fontSize.base, 
    fontWeight: '700', 
    color: '#0D0D1A', 
    marginBottom: 4 
  },
  toggleSubtitle: { 
    fontSize: Typography.fontSize.xs, 
    color: Colors.textMuted, 
    fontWeight: '500' 
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
});
