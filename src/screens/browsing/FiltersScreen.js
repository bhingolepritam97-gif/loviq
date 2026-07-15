/**
 * FiltersScreen.js
 *
 * Discovery filter sheet — shown when the user taps the filter icon on DiscoverScreen.
 * All three filter axes (gender preference, distance, age range) are persisted to the
 * backend via PATCH /users/me so they survive app restarts and take effect on the
 * next /deck fetch.
 *
 * Also updates the in-memory AuthContext profile so the Discover feed refreshes
 * immediately when the user navigates back.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/UserService';

const KM_TO_MI = 0.621371;
const MI_TO_KM = 1.60934;

const GENDERS = [
  { value: 'Women',    label: 'Women',    emoji: '♀' },
  { value: 'Men',      label: 'Men',      emoji: '♂' },
  { value: 'Everyone', label: 'Everyone', emoji: '⚡' },
];

// ─── Pure-JS Single Slider ─────────────────────────────────────────────────────
const SingleSlider = ({ min, max, value, onChange, formatLabel }) => {
  const [width, setWidth] = useState(0);
  const [localVal, setLocalVal] = useState(value);
  const localValRef = useRef(value);

  useEffect(() => {
    setLocalVal(value);
    localValRef.current = value;
  }, [value]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!width) return;
        const pct = Math.max(0, Math.min(1, evt.nativeEvent.locationX / width));
        const val = Math.round(min + pct * (max - min));
        setLocalVal(val);
        localValRef.current = val;
      },
      onPanResponderMove: (evt) => {
        if (!width) return;
        const pct = Math.max(0, Math.min(1, evt.nativeEvent.locationX / width));
        const val = Math.round(min + pct * (max - min));
        setLocalVal(val);
        localValRef.current = val;
      },
      onPanResponderRelease: () => {
        onChange(localValRef.current);
      },
    })
  ).current;

  const pct = (localVal - min) / (max - min);

  return (
    <View style={styles.sliderOuter}>
      <View
        style={styles.sliderTrackWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.sliderTrackBg} />
        <View style={[styles.sliderTrackFill, { width: `${pct * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${pct * 100}%`, transform: [{ translateX: -14 }] }]}>
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.thumbGradient}
          />
        </View>
      </View>
      {formatLabel && (
        <View style={[styles.thumbLabel, { left: `${pct * 100}%`, transform: [{ translateX: -28 }] }]}>
          <Text style={styles.thumbLabelText}>{formatLabel(localVal)}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Pure-JS Double Slider ─────────────────────────────────────────────────────
const DoubleSlider = ({ min, max, values, onChange }) => {
  const [width, setWidth] = useState(0);
  const [localVals, setLocalVals] = useState(values);
  const localValsRef = useRef(values);
  const active = useRef(null);

  useEffect(() => {
    setLocalVals(values);
    localValsRef.current = values;
  }, [values]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!width) return;
        const pct = evt.nativeEvent.locationX / width;
        const clickVal = min + pct * (max - min);
        active.current =
          Math.abs(clickVal - localValsRef.current[0]) < Math.abs(clickVal - localValsRef.current[1]) ? 'min' : 'max';
      },
      onPanResponderMove: (evt) => {
        if (!width || !active.current) return;
        const pct = Math.max(0, Math.min(1, evt.nativeEvent.locationX / width));
        const val = Math.round(min + pct * (max - min));
        const currentVals = localValsRef.current;
        let newVals;
        if (active.current === 'min') {
          newVals = [Math.max(min, Math.min(val, currentVals[1] - 1)), currentVals[1]];
        } else {
          newVals = [currentVals[0], Math.min(max, Math.max(val, currentVals[0] + 1))];
        }
        setLocalVals(newVals);
        localValsRef.current = newVals;
      },
      onPanResponderRelease: () => {
        active.current = null;
        onChange(localValsRef.current);
      },
    })
  ).current;

  const pMin = (localVals[0] - min) / (max - min);
  const pMax = (localVals[1] - min) / (max - min);

  return (
    <View style={styles.sliderOuter}>
      <View
        style={styles.sliderTrackWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.sliderTrackBg} />
        <View
          style={[
            styles.sliderTrackFill,
            { position: 'absolute', left: `${pMin * 100}%`, right: `${(1 - pMax) * 100}%`, height: 6, borderRadius: 3 },
          ]}
        />
        {/* Min thumb */}
        <View style={[styles.sliderThumb, { left: `${pMin * 100}%`, transform: [{ translateX: -14 }] }]}>
          <LinearGradient colors={Gradients.primary.colors} start={Gradients.primary.start} end={Gradients.primary.end} style={styles.thumbGradient} />
        </View>
        {/* Max thumb */}
        <View style={[styles.sliderThumb, { left: `${pMax * 100}%`, transform: [{ translateX: -14 }] }]}>
          <LinearGradient colors={Gradients.primary.colors} start={Gradients.primary.start} end={Gradients.primary.end} style={styles.thumbGradient} />
        </View>
      </View>
      {/* Thumb labels below */}
      <View style={styles.doubleThumbLabels}>
        <View style={[styles.thumbLabel, { left: `${pMin * 100}%`, transform: [{ translateX: -18 }] }]}>
          <Text style={styles.thumbLabelText}>{localVals[0]}</Text>
        </View>
        <View style={[styles.thumbLabel, { left: `${pMax * 100}%`, transform: [{ translateX: -18 }] }]}>
          <Text style={styles.thumbLabelText}>{localVals[1]}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, badge, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge ? <Text style={styles.sectionBadge}>{badge}</Text> : null}
    </View>
    {children}
  </View>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();

  // Distance in km internally; display in miles to match app convention
  const initDistanceKm = profile?.maxDistanceKm ?? 80.5;
  const initAgeRange   = profile?.age_range ?? [profile?.ageMin ?? 18, profile?.ageMax ?? 65];
  const initGender     = profile?.interestedIn ?? 'Everyone';

  const [gender, setGender]         = useState(initGender);
  const [distanceKm, setDistanceKm] = useState(initDistanceKm);
  const [ageRange, setAgeRange]     = useState(initAgeRange);
  const [saving, setSaving]         = useState(false);

  const distanceMiles = Math.round(distanceKm * KM_TO_MI);

  // Detect unsaved changes
  const isDirty =
    gender !== initGender ||
    Math.round(distanceKm) !== Math.round(initDistanceKm) ||
    ageRange[0] !== initAgeRange[0] ||
    ageRange[1] !== initAgeRange[1];

  const handleApply = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    const updates = {
      interestedIn: gender,
      maxDistanceKm: distanceKm,
      ageMin: ageRange[0],
      ageMax: ageRange[1],
    };

    // Optimistic local update so Discover refetches immediately on back()
    setProfile({
      ...profile,
      interestedIn: gender,
      maxDistanceKm: distanceKm,
      distance_range: distanceMiles,
      ageMin: ageRange[0],
      ageMax: ageRange[1],
      age_range: ageRange,
    });

    try {
      if (user?.uid) {
        await updateUserProfile(user.uid, updates);
      }
    } catch (err) {
      console.warn('[FiltersScreen] Failed to persist filters:', err.message);
    } finally {
      setSaving(false);
    }

    navigation.goBack();
  }, [saving, gender, distanceKm, ageRange, profile, user]);

  const handleReset = useCallback(() => {
    setGender('Everyone');
    setDistanceKm(80.5);
    setAgeRange([18, 65]);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          id="filters-close-btn"
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Discovery Filters</Text>

        <TouchableOpacity
          id="filters-reset-btn"
          onPress={handleReset}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.headerBtnText, { color: Colors.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Show Me ─────────────────────────────────────────────────── */}
        <Section title="Show Me">
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const active = gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  id={`gender-filter-${g.value.toLowerCase()}`}
                  style={[styles.genderBtn, active && styles.genderBtnActive]}
                  onPress={() => setGender(g.value)}
                  activeOpacity={0.75}
                >
                  {active ? (
                    <LinearGradient
                      colors={Gradients.primary.colors}
                      start={Gradients.primary.start}
                      end={Gradients.primary.end}
                      style={styles.genderBtnGradient}
                    >
                      <Text style={styles.genderEmojiActive}>{g.emoji}</Text>
                      <Text style={styles.genderLabelActive}>{g.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.genderBtnGradient}>
                      <Text style={styles.genderEmoji}>{g.emoji}</Text>
                      <Text style={styles.genderLabel}>{g.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* ── Maximum Distance ─────────────────────────────────────────── */}
        <Section
          title="Maximum Distance"
          badge={`${distanceMiles} mi · ${Math.round(distanceKm)} km`}
        >
          <SingleSlider
            min={8}
            max={322}   // ~5 mi → 200 mi in km
            value={distanceKm}
            onChange={setDistanceKm}
          />
          <View style={styles.sliderEndLabels}>
            <Text style={styles.sliderEndLabel}>5 mi</Text>
            <Text style={styles.sliderEndLabel}>200 mi</Text>
          </View>
          <View style={styles.distancePills}>
            {[16, 40, 80, 160].map((km) => (
              <TouchableOpacity
                key={km}
                id={`distance-quick-${km}km`}
                style={[styles.quickPill, Math.abs(distanceKm - km) < 4 && styles.quickPillActive]}
                onPress={() => setDistanceKm(km)}
              >
                <Text style={[styles.quickPillText, Math.abs(distanceKm - km) < 4 && styles.quickPillTextActive]}>
                  {Math.round(km * KM_TO_MI)} mi
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* ── Age Range ────────────────────────────────────────────────── */}
        <Section
          title="Age Range"
          badge={`${ageRange[0]} – ${ageRange[1]} yrs`}
        >
          <DoubleSlider
            min={18}
            max={75}
            values={ageRange}
            onChange={setAgeRange}
          />
          <View style={styles.sliderEndLabels}>
            <Text style={styles.sliderEndLabel}>18</Text>
            <Text style={styles.sliderEndLabel}>75+</Text>
          </View>
        </Section>

        {/* ── Info note ────────────────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Filters are saved to your account and applied on all your devices.
            The deck refreshes automatically when you go back.
          </Text>
        </View>

      </ScrollView>

      {/* ── Apply Button ─────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {isDirty && (
          <Text style={styles.changesHint}>Unsaved changes</Text>
        )}
        <TouchableOpacity
          id="apply-filters-btn"
          style={styles.applyBtn}
          onPress={handleApply}
          activeOpacity={0.85}
          disabled={saving}
        >
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.applyGradient}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.applyText}>Apply Filters</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    height: 60,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },

  // ── Section
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionBadge: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },

  // ── Gender pills
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  genderBtnActive: {
    borderColor: 'transparent',
    ...Shadow.primary,
  },
  genderBtnGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  genderEmoji: { fontSize: 20 },
  genderEmojiActive: { fontSize: 20 },
  genderLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  genderLabelActive: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },

  // ── Slider
  sliderOuter: {
    marginTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  sliderTrackWrap: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  sliderTrackFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    top: '50%',
    marginTop: -14,
    ...Shadow.primary,
  },
  thumbGradient: {
    width: '100%',
    height: '100%',
  },
  thumbLabel: {
    position: 'absolute',
    backgroundColor: Colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    top: -4,
  },
  thumbLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  doubleThumbLabels: {
    position: 'relative',
    height: 20,
    marginTop: -8,
  },
  sliderEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.sm,
  },
  sliderEndLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },

  // ── Quick-select distance pills
  distancePills: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickPill: {
    flex: 1,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  quickPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  quickPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },

  // ── Footer / Apply
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  changesHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  applyBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.primary,
  },
  applyGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: Typography.fontSize.base,
    letterSpacing: 0.2,
  },
});
