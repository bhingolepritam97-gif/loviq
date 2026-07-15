import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Gradients, Typography } from '../../theme';
import { expandRadiusBy, getRecycledPasses } from '../../utils/profileFeedLogic';
import LogoLoader from '../../components/brand/LogoLoader';
import AnimatedLogo from '../../components/brand/AnimatedLogo';

/**
 * EmptyStateScreen.js
 *
 * Shown when the normal discovery feed runs dry.
 * Instead of displaying a countdown lockout, it offers two high-engagement actions:
 *  1. Recycle Skipped Profiles: Immediately reload all profiles skipped with "pass" action.
 *  2. Widen Search: Dynamically expand the search radius by +15 miles and check for matches.
 */

export default function EmptyStateScreen({ navigation, route, inline = false }) {
  const insets = useSafeAreaInsets();
  const { currentRadius = 25, userLocation = null } = route?.params || {};

  // ─── State ────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('loading'); // 'loading' | 'recycle_option' | 'widen_option'
  const [recycledCount, setRecycledCount] = useState(0);
  const [recycledList, setRecycledList] = useState([]);

  // ─── Animations ───────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // Calculate top padding based on inline rendering
  const paddingTop = inline ? 0 : insets.top;

  // ─── Check options on mount ───────────────────────────────────────────────
  useEffect(() => {
    checkEngagementOptions();
  }, []);

  // Fade in animation whenever phase changes
  useEffect(() => {
    if (phase === 'loading') return;
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase]);

  const checkEngagementOptions = async () => {
    try {
      const skipped = await getRecycledPasses(true); // ignore cooldown to see all skips
      if (skipped.length > 0) {
        setRecycledList(skipped);
        setRecycledCount(skipped.length);
        setPhase('recycle_option');
      } else {
        setPhase('widen_option');
      }
    } catch (e) {
      console.warn("Failed checking empty state fallback options:", e);
      setPhase('widen_option');
    }
  };

  const handleRecyclePasses = () => {
    if (recycledList.length > 0) {
      navigation.navigate('Discover', {
        profiles: recycledList,
        isExpandedSet: false,
        recycledSet: true,
      });
    }
  };

  const handleWidenSearch = async () => {
    setPhase('loading');
    try {
      const result = await expandRadiusBy(userLocation, currentRadius, 15);
      if (result.profiles.length > 0) {
        navigation.navigate('Discover', {
          profiles: result.profiles,
          isExpandedSet: true,
          expandedRadius: result.newRadius,
        });
      } else {
        // If still empty, display the manual filter adjustment view
        setPhase('widen_option');
      }
    } catch (e) {
      console.warn("Failed to widen search:", e);
      setPhase('widen_option');
    }
  };

  // ─── Render: Loading ──────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <View style={[styles.container, { paddingTop }]}>
        <LogoLoader visible={true} inline={true} />
        <Text style={styles.loadingText}>Searching nearby...</Text>
      </View>
    );
  }

  // ─── Render: Recycle Option Available ─────────────────────────────────────
  if (phase === 'recycle_option') {
    return (
      <Animated.View
        style={[
          styles.container,
          { paddingTop, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconWrapper}>
          <AnimatedLogo type="icon" animation="pulse" size="lg" />
        </View>

        <Text style={styles.title}>Give skipped profiles a second chance?</Text>

        <Text style={styles.subtitle}>
          You've run out of new profiles nearby. You have passed on {recycledCount} {recycledCount === 1 ? 'profile' : 'profiles'} that you can recycle to review them again.
        </Text>

        {/* Primary CTA: Recycle */}
        <TouchableOpacity
          id="recycle-passes-btn"
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
            <Text style={styles.primaryButtonText}>
              Recycle {recycledCount} skipped {recycledCount === 1 ? 'profile' : 'profiles'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary CTA: Widen Search */}
        <TouchableOpacity
          id="widen-search-alt-btn"
          onPress={handleWidenSearch}
          style={styles.outlineButton}
        >
          <Text style={styles.outlineButtonText}>Widen search (+15 miles)</Text>
        </TouchableOpacity>

        {/* Adjust filters */}
        <TouchableOpacity
          id="adjust-filters-btn"
          onPress={() => navigation.navigate('Filters')}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryLink}>Adjust filters manually</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ─── Render: Widen Search Option (Default fallback) ───────────────────────
  return (
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
        No more profiles match your current search radius or filters. Try widening your search to discover more people in your region.
      </Text>

      {/* Primary CTA: Widen search */}
      <TouchableOpacity
        id="widen-search-btn"
        style={styles.primaryButton}
        onPress={handleWidenSearch}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>Widen search (+15 miles)</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Secondary CTA: Adjust Filters */}
      <TouchableOpacity
        id="adjust-filters-manual-btn"
        onPress={() => navigation.navigate('Filters')}
        style={styles.outlineButton}
      >
        <Text style={styles.outlineButtonText}>Adjust filters manually</Text>
      </TouchableOpacity>

      {/* See likes link */}
      <TouchableOpacity
        id="see-likes-btn"
        onPress={() => navigation.navigate('Likes')}
        style={styles.secondaryBtn}
      >
        <Text style={styles.secondaryLink}>See who already liked you →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },

  // ── Loading state
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 17,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // ── Shared content
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

  // ── Buttons
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
