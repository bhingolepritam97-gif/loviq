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
  Switch,
} from 'react-native';
import { ResponsiveContainer } from '../../core/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
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
interface SingleSliderProps {
  min: any;
  max: any;
  value: any;
  onChange: any;
  formatLabel?: any;
}

const SingleSlider = ({ min, max, value, onChange, formatLabel }: SingleSliderProps) => {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
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
    <View 
      style={styles.sliderOuter}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel="Maximum distance slider"
      accessibilityValue={{ min, max, now: localVal, text: `${Math.round(localVal * KM_TO_MI)} miles` }}
      accessibilityHint="Slide left or right to change maximum search radius."
    >
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
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
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
    <View 
      style={styles.sliderOuter}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel="Age range slider"
      accessibilityValue={{ min, max, now: localVals[0], text: `From ${localVals[0]} to ${localVals[1]} years old` }}
      accessibilityHint="Slide left or right to modify minimum and maximum ages."
    >
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
interface SectionProps {
  title: string;
  badge?: any;
  children: any;
}

const Section = ({ title, badge, children }: SectionProps) => {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? <Text style={styles.sectionBadge}>{badge}</Text> : null}
      </View>
      {children}
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);

  // Distance in km internally; display in miles to match app convention
  const initDistanceKm = profile?.maxDistanceKm ?? 80.5;
  const initAgeRange   = profile?.age_range ?? [profile?.ageMin ?? 18, profile?.ageMax ?? 65];
  const initGender     = profile?.interestedIn ?? 'Everyone';

  const initVerifiedOnly = profile?.verifiedOnly ?? false;

  const [gender, setGender]         = useState(initGender);
  const [distanceKm, setDistanceKm] = useState(initDistanceKm);
  const [ageRange, setAgeRange]     = useState(initAgeRange);
  const [verifiedOnly, setVerifiedOnly] = useState(initVerifiedOnly);
  const [saving, setSaving]         = useState(false);

  const distanceMiles = Math.round(distanceKm * KM_TO_MI);

  // Detect unsaved changes
  const isDirty =
    gender !== initGender ||
    Math.round(distanceKm) !== Math.round(initDistanceKm) ||
    ageRange[0] !== initAgeRange[0] ||
    ageRange[1] !== initAgeRange[1] ||
    verifiedOnly !== initVerifiedOnly;

  const handleApply = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    const updates = {
      interestedIn: gender,
      maxDistanceKm: distanceKm,
      ageMin: ageRange[0],
      ageMax: ageRange[1],
      verifiedOnly: verifiedOnly,
    };

    try {
      const res: any = await updateUserProfile(user.id, updates);
      // Update local profile so feed refreshes instantly — safely handle different response shapes
      if (res?.data?.profile) {
        setProfile(res.data.profile);
      } else if (res?.profile) {
        setProfile(res.profile);
      }
      navigation.goBack();
    } catch (err) {
      console.warn("Failed to update filters:", err);
      // fallback just close it
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [saving, gender, distanceKm, ageRange, verifiedOnly, user, setProfile, navigation]);

  const handleReset = useCallback(() => {
    setGender('Everyone');
    setDistanceKm(80.5); // ~50 miles
    setAgeRange([18, 65]);
    setVerifiedOnly(false);
  }, []);

  return (
    <ResponsiveContainer safeArea={false} centered={false}>
      <View style={styles.container}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity
          id="filters-close-btn"
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close filters"
        >
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Discovery Filters</Text>

        <TouchableOpacity
          id="filters-reset-btn"
          onPress={handleReset}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reset filters to default"
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
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`Filter by: ${g.label}`}
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
            formatLabel={(v: number) => `${Math.round(v * KM_TO_MI)} mi`}
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
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Set search radius to ${Math.round(km * KM_TO_MI)} miles`}
                accessibilityState={{ selected: Math.abs(distanceKm - km) < 4 }}
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

        {/* ── Dealbreakers ────────────────────────────────────────────────── */}
        <Section title="Dealbreakers" badge={undefined}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
              <Text style={styles.switchLabel}>Verified Profiles Only</Text>
              <Text style={styles.switchSublabel}>Only show profiles that have verified photos.</Text>
            </View>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.white}
            />
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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Apply filters and refresh matches feed"
          accessibilityState={{ disabled: saving }}
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
    </ResponsiveContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (Colors) => StyleSheet.create({
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
    fontSize: Typography.fontSize.xl,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },

  scroll: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // ── Section
  section: {
    marginBottom: Spacing.xl + 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },

  // ── Gender
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderBtn: {
    flex: 1,
    height: 90,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    borderWidth: 0, 
    ...Shadow.primary,
  },
  genderBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  genderEmoji: {
    fontSize: 24,
    marginBottom: 4,
    color: Colors.textLight,
  },
  genderEmojiActive: {
    fontSize: 24,
    marginBottom: 4,
    color: Colors.white,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  genderLabelActive: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // ── Sliders
  sliderOuter: {
    paddingVertical: Spacing.sm,
  },
  sliderTrackWrap: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    ...Shadow.md,
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
    zIndex: 2,
  },
  thumbGradient: {
    flex: 1,
  },
  thumbLabel: {
    position: 'absolute',
    top: 24,
    width: 56,
    alignItems: 'center',
  },
  thumbLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
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
  
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  switchSublabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
