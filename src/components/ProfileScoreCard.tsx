/**
 * ProfileScoreCard.js
 *
 * Self-contained "Profile Excellence" card that shows:
 *  • An animated SVG-style arc ring (drawn with Animated + border tricks)
 *  • The numeric score + motivational label
 *  • A tappable "Show checklist" toggle
 *  • Weighted checklist rows — each showing ✓ or ○, label, sublabel, and pts earned/max
 *
 * Usage:
 *   <ProfileScoreCard profile={profile} onItemPress={(route) => navigation.navigate(route)} />
 *
 * Props:
 *   profile        {object}   AuthContext profile
 *   onItemPress    {function} (ctaRoute: string) => void  — navigate to the fix screen
 *   style          {object}   optional outer container style
 *   compact        {boolean}  if true, show only ring + summary (no checklist), default false
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { calculateProfileScore, scoreLabel, scoreColor } from '../utils/calculateProfileScore';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Ring constants ─────────────────────────────────────────────────────────────
const RING_SIZE   = 120;
const RING_STROKE = 10;
const INNER_SIZE  = RING_SIZE - RING_STROKE * 2;

// ─── Animated Arc Ring ──────────────────────────────────────────────────────────
// We simulate an arc using two overlapping semicircle views — a classic "donut" technique
// that works without SVG or third-party libs.
//
// Architecture:
//   Container (RING_SIZE × RING_SIZE, circular clip)
//     ├─ Background circle (border = track color)
//     └─ Two half-circles that rotate to reveal progress
//
// The right half rotates from 0° to 180° (0–50%), then the left half takes over (50–100%).
function ScoreRing({ score, color }) {
  const { colors: Colors } = useTheme();
  const ringStyles = createRingStyles(Colors);
  const animVal  = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: score,
      duration: 900,
      useNativeDriver: false,
    }).start();
    prevScore.current = score;
  }, [score]);

  const rightRotate = animVal.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
  });
  const leftRotate = animVal.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  return (
    <View style={[ringStyles.container, { width: RING_SIZE, height: RING_SIZE }]}>
      {/* Track */}
      <View style={[ringStyles.trackCircle, { borderColor: Colors.border }]} />

      {/* Right half-pie clip */}
      <View style={[ringStyles.halfClip, ringStyles.rightClip]}>
        <Animated.View
          style={[
            ringStyles.halfPie,
            ringStyles.rightPie,
            { borderColor: color, transform: [{ rotate: rightRotate }] },
          ]}
        />
      </View>

      {/* Left half-pie clip */}
      <View style={[ringStyles.halfClip, ringStyles.leftClip]}>
        <Animated.View
          style={[
            ringStyles.halfPie,
            ringStyles.leftPie,
            { borderColor: color, transform: [{ rotate: leftRotate }] },
          ]}
        />
      </View>

      {/* Inner white circle to create donut hole */}
      <View style={ringStyles.innerCircle} />
    </View>
  );
}

const createRingStyles = (Colors) => StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCircle: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
  },
  halfClip: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  rightClip: {
    left: RING_SIZE / 2,
    width: RING_SIZE / 2,
  },
  leftClip: {
    width: RING_SIZE / 2,
  },
  halfPie: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
  },
  rightPie: {
    left: -RING_SIZE / 2,
    borderLeftColor:   'transparent',
    borderBottomColor: 'transparent',
  },
  leftPie: {
    borderRightColor: 'transparent',
    borderTopColor:   'transparent',
  },
  innerCircle: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: Colors.background,
  },
});

// ── Checklist Row ───────────────────────────────────────────────────────────────
function ChecklistRow({ item, onPress }) {
  const { colors: Colors } = useTheme();
  const rowStyles = createRowStyles(Colors);
  const { done, icon, label, sublabel, earned, max } = item;
  const pct = Math.round((earned / max) * 100);

  return (
    <TouchableOpacity
      id={`score-checklist-${item.key}`}
      style={rowStyles.row}
      onPress={() => onPress(item.ctaRoute)}
      activeOpacity={done ? 0.6 : 0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Checklist item: ${label}`}
    >
      <View style={rowStyles.left}>
        <View style={[rowStyles.iconWrap, done && rowStyles.iconWrapDone]}>
          {done ? (
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          ) : (
            <Text style={rowStyles.iconEmoji}>{icon}</Text>
          )}
        </View>
        <View style={rowStyles.textBlock}>
          <Text style={[rowStyles.label, done && rowStyles.labelDone]}>{label}</Text>
          <Text style={rowStyles.sublabel} numberOfLines={2}>{sublabel}</Text>
        </View>
      </View>
      <View style={rowStyles.right}>
        <Text style={[rowStyles.pts, done && rowStyles.ptsDone]}>
          {earned}/{max}
        </Text>
        <Text style={rowStyles.ptsUnit}>pts</Text>
      </View>
    </TouchableOpacity>
  );
}

const createRowStyles = (Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  iconWrapDone: {
    backgroundColor: '#10b981',
  },
  iconEmoji: { fontSize: 14 },
  textBlock: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  labelDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  sublabel: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  right: { alignItems: 'flex-end', minWidth: 36 },
  pts: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  ptsDone: { color: '#10b981' },
  ptsUnit: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ── Main Component ──────────────────────────────────────────────────────────────
export default function ProfileScoreCard({ profile, onItemPress, style, compact = false }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const { score, items } = calculateProfileScore(profile);
  const color  = scoreColor(score);
  const label  = scoreLabel(score);
  const missingCount = items.filter((i) => !i.done).length;

  const toggleChecklist = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChecklistOpen((prev) => !prev);
  }, []);

  // Sort: incomplete first (highest max pts first for best nudge order)
  const sortedItems = [...items].sort((a, b) => {
    if (a.done === b.done) return b.max - a.max;
    return a.done ? 1 : -1;
  });

  return (
    <View style={[styles.card, style]}>
      {/* ── Header row: ring + summary ──────────────────────────────── */}
      <View style={styles.topRow}>
        <View style={styles.ringWrap}>
          <ScoreRing score={score} color={color} />
          {/* Score overlay */}
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={[styles.ringScore, { color }]}>{score}</Text>
            <Text style={styles.ringOutOf}>/100</Text>
          </View>
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.labelRow}>
            <View style={[styles.labelPill, { backgroundColor: color + '18' }]}>
              <Text style={[styles.labelPillText, { color }]}>{label}</Text>
            </View>
          </View>

          <Text style={styles.summaryTitle}>Profile Excellence</Text>
          <Text style={styles.summarySubtitle}>
            {score >= 95
              ? 'Your profile is maxed out! 🌟'
              : missingCount === 0
              ? 'Almost perfect — keep it up!'
              : `${missingCount} action${missingCount > 1 ? 's' : ''} to improve your score`}
          </Text>

          {!compact && (
            <TouchableOpacity
              id="score-checklist-toggle"
              style={styles.toggleBtn}
              onPress={toggleChecklist}
              activeOpacity={0.75}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={checklistOpen ? 'Hide checklist' : 'Show checklist'}
            >
              <Text style={styles.toggleText}>
                {checklistOpen ? 'Hide checklist' : 'Show checklist'}
              </Text>
              <Ionicons
                name={checklistOpen ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Segmented score bar (always visible) ────────────────────── */}
      <View style={styles.barWrap}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { width: `${score}%`, backgroundColor: color },
            ]}
          />
        </View>
        {/* Milestone ticks */}
        {[40, 60, 80].map((pct) => (
          <View
            key={pct}
            style={[styles.barTick, { left: `${pct}%` }]}
            pointerEvents="none"
          />
        ))}
      </View>

      {/* ── Checklist (expandable) ───────────────────────────────────── */}
      {!compact && checklistOpen && (
        <View style={styles.checklist}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistTitle}>Your improvement checklist</Text>
            <Text style={styles.checklistSubtitle}>Tap any item to fix it instantly</Text>
          </View>
          {sortedItems.map((item, idx) => (
            <ChecklistRow
              key={item.key}
              item={item}
              onPress={(route) => {
                if (typeof onItemPress === 'function') onItemPress(route);
              }}
            />
          ))}
          {/* Remove bottom border on last row */}
          <View style={styles.checklistFooter}>
            <Text style={styles.checklistFooterText}>
              Score updates live as you edit your profile
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const createStyles = (Colors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.md,
  },

  // Ring area
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringScore: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -1,
  },
  ringOutOf: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: -2,
  },

  // Summary text
  summaryBlock: { flex: 1 },
  labelRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  labelPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  labelPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  summarySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Progress bar
  barWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: Colors.background,
  },

  // Checklist
  checklist: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing.md,
  },
  checklistHeader: {
    marginBottom: Spacing.sm,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  checklistSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checklistFooter: {
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  checklistFooterText: {
    fontSize: 11,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});
