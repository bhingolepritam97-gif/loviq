import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackOnboardingStep, trackOnboardingStepCompleted } from '../../utils/onboardingAnalytics';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const INTEREST_OPTIONS = [
  'Travel', 'Fitness', 'Music', 'Foodie', 'Movies', 'Reading',
  'Gaming', 'Art', 'Hiking', 'Dogs', 'Cats', 'Coffee',
  'Yoga', 'Photography', 'Cooking', 'Dancing', 'Wine', 'Sports',
  'Nature', 'Astrology'
];

const MIN_SELECTIONS = 3;

export default function InterestsScreen({ navigation, route }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const startTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('interests');
  }, []);

  const toggle = (interest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const isValid = selected.length >= MIN_SELECTIONS;

  const handleContinue = () => {
    trackOnboardingStepCompleted('interests', Date.now() - startTime.current);
    navigation.navigate('PhotoUpload', {
      ...route.params,
      interests: selected,
    });
  };

  const filteredOptions = INTEREST_OPTIONS.filter((interest) =>
    interest.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <View style={[styles.progressBarFill, { width: '100%' }]} />
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
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          <Text style={styles.title}>What are you into?</Text>
          <Text style={styles.subtitle}>
            Pick at least {MIN_SELECTIONS} — this helps us curate your romantic discovery.
          </Text>

          {/* Search Input */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#7A667A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search interests..."
              placeholderTextColor="#7A667A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              selectionColor="#E8628F"
            />
          </View>

          {/* Interests Pill Grid */}
          <View style={styles.pillWrap} accessible={false}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((interest) => {
                const isSelected = selected.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggle(interest)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Interest: ${interest}`}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.pillCheck} />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noResultsText}>No interests found matching "{searchQuery}"</Text>
            )}
          </View>

          {/* Promo Card at Bottom of Scroll */}
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600' }}
            style={styles.promoCard}
            imageStyle={{ borderRadius: Radius.lg }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(19, 5, 22, 0.9)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Find your aesthetic</Text>
              <Text style={styles.promoDesc}>
                We use your interests to build a beautiful connection story that feels like you.
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Footer Link Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueLinkButton, !isValid && styles.continueLinkButtonDisabled]}
            disabled={!isValid}
            onPress={handleContinue}
            activeOpacity={isValid ? 0.7 : 1}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Continue to photo upload step"
          >
            <Text style={[styles.continueLinkText, !isValid && styles.continueLinkTextDisabled]}>
              CONTINUE{' '}
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={18} 
              color={isValid ? '#E8628F' : '#7A667A'} 
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 3 of 3</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    justifyContent: 'space-between',
  },
  mainWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: '#A592A5',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#FFF0F3',
  },
  pillWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    paddingBottom: Spacing.xl 
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, 
    paddingHorizontal: Spacing.base, 
    borderRadius: Radius.full,
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillSelected: { 
    backgroundColor: '#E8628F', 
    borderColor: '#E8628F',
    ...Shadow.primary,
  },
  pillCheck: {
    marginRight: 4,
  },
  pillText: { 
    color: '#A592A5', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  pillTextSelected: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  noResultsText: {
    color: '#A592A5',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    marginVertical: Spacing['2xl'],
  },
  promoCard: {
    width: '100%',
    height: 140,
    borderRadius: Radius.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  promoContent: {
    padding: Spacing.base,
    zIndex: 2,
  },
  promoTitle: {
    color: '#FFF0F3',
    fontSize: 16,
    fontFamily: Typography.fontFamily.serif,
    fontWeight: '700',
    marginBottom: 4,
  },
  promoDesc: {
    color: '#A592A5',
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.base,
  },
  continueLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    width: '100%',
  },
  continueLinkButtonDisabled: {
    opacity: 0.5,
  },
  continueLinkText: {
    color: '#E8628F',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  continueLinkTextDisabled: {
    color: '#7A667A',
  },
  arrowIcon: {
    marginTop: 1,
  },
  stepText: {
    fontSize: 12,
    color: '#A592A5',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});
