import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { updateUserProfile } from '../../services/UserService';
import AnimatedLogo from '../../components/brand/AnimatedLogo';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveContainer } from '../../core/responsive';

/**
 * EmptyStateScreen.js
 *
 * Shown when the normal discovery feed runs dry.
 * Instead of displaying a countdown lockout, it offers two high-engagement actions:
 *  1. Recycle Skipped Profiles: Immediately reload all profiles skipped with "pass" action in Postgres.
 *  2. Widen Search: Dynamically expand the search radius by +15 miles and check for matches in Postgres.
 */

export default function EmptyStateScreen({ navigation, route, inline = false }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { currentRadius = 25 } = route?.params || {};
  const { user, profile, setProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // Calculate top padding based on inline rendering
  const paddingTop = inline ? 0 : insets.top;

  // Fade in animation on mount
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRecyclePasses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiClient('/swipes/recycle', { method: 'POST' });
      if (res.success && res.count > 0) {
        Alert.alert('Profiles Recycled! ⚡', `We recycled ${res.count} profiles you passed on. Keep swiping!`);
        navigation.navigate('Discover', { refresh: true });
      } else {
        Alert.alert('No Profiles', 'You have not passed on any profiles nearby yet!');
      }
    } catch (e) {
      console.warn("Failed to recycle passes:", e);
      Alert.alert('Error', 'Unable to recycle profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWidenSearch = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const newRadiusMiles = currentRadius + 15;
      const newRadiusKm = newRadiusMiles * 1.60934;
      
      // Update maxDistanceKm in Postgres
      const updated = await updateUserProfile(user.uid, { maxDistanceKm: newRadiusKm, distance_range: newRadiusMiles });
      if (updated) {
        setProfile(updated);
      } else {
        // Local fallback in state if update returned null
        setProfile({ ...profile, maxDistanceKm: newRadiusKm, distance_range: newRadiusMiles });
      }

      Alert.alert('Search Widened! 🌍', `Your search radius has been increased to ${newRadiusMiles} miles.`);
      navigation.navigate('Discover', { refresh: true });
    } catch (e) {
      console.warn("Failed to widen search:", e);
      Alert.alert('Error', 'Failed to update search radius.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Updating settings...</Text>
      </View>
    );
  }

  return (
    <ResponsiveContainer>
      <Animated.View
        style={[
          styles.container,
          { paddingTop, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
      <View style={styles.iconWrapper}>
        <AnimatedLogo type="icon" animation="pulse" size="lg" />
      </View>

      <Text style={styles.title}>Out of nearby suggestions</Text>

      <Text style={styles.subtitle}>
        You've swiped through everyone matching your current discovery filters. Widen your search range or recycle skipped profiles to keep going.
      </Text>

      {/* Primary CTA: Recycle Passes */}
      <TouchableOpacity
        id="recycle-passes-btn"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Recycle Skipped Profiles"
        style={styles.primaryButton}
        onPress={handleRecyclePasses}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>Recycle Skipped Profiles</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Secondary CTA: Widen Search */}
      <TouchableOpacity
        id="widen-search-btn"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Widen search by 15 miles"
        onPress={handleWidenSearch}
        style={styles.outlineButton}
      >
        <Text style={styles.outlineButtonText}>Widen search (+15 miles)</Text>
      </TouchableOpacity>

      {/* Tertiary: Adjust filters */}
      <TouchableOpacity
        id="adjust-filters-btn"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Adjust filters manually"
        onPress={() => navigation.navigate('Filters')}
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryLink}>Adjust filters manually</Text>
      </TouchableOpacity>
    </Animated.View>
    </ResponsiveContainer>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 17,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  iconWrapper: { marginBottom: Spacing.xl, opacity: 0.8 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: Spacing['2xl'],
  },
  primaryButton: {
    width: '100%',
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  buttonGradient: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  outlineButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  secondaryBtn: { paddingVertical: Spacing.md },
  secondaryLink: { color: Colors.textMuted, fontSize: 15, fontWeight: '500' },
});
