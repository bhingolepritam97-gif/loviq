/**
 * VerifiedBadge.js
 *
 * Shared component that surfaces `isVerified` as a visible, meaningful signal.
 * Used on swipe cards (size="sm") and profile detail screens (size="md").
 *
 * Props:
 *   isVerified   {boolean}  Whether the profile is verified
 *   size         {"sm"|"md"} Controls icon + text size. Default "sm".
 *   showLabel    {boolean}  Show the "Verified" text label. Default false for sm, true for md.
 *   tappable     {boolean}  If true, tapping opens a bottom-sheet tooltip. Default false.
 *   style        {object}   Additional container style overrides
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, Shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

// ─── Verification colour tokens ───────────────────────────────────────────────
const VERIFIED_COLOR   = '#3B82F6';          // Blue — universally understood as "verified"
const VERIFIED_BG      = 'rgba(59,130,246,0.12)';
const VERIFIED_BORDER  = 'rgba(59,130,246,0.3)';
const UNVERIFIED_BG    = 'rgba(138,138,154,0.10)';

export default function VerifiedBadge({
  isVerified = false,
  size = 'sm',
  showLabel,
  tappable = false,
  style,
}: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Default label visibility: always shown in md, never in sm (unless forced)
  const shouldShowLabel = showLabel !== undefined ? showLabel : size === 'md';

  const iconSize   = size === 'md' ? 20 : 15;
  const fontSize   = size === 'md' ? 13 : 11;
  const padH       = size === 'md' ? 10 : 6;
  const padV       = size === 'md' ? 5  : 3;

  const containerStyle = [
    styles.badge,
    {
      backgroundColor: isVerified ? VERIFIED_BG : UNVERIFIED_BG,
      borderColor: isVerified ? VERIFIED_BORDER : 'rgba(138,138,154,0.2)',
      paddingHorizontal: padH,
      paddingVertical: padV,
    },
    style,
  ];

  const badgeContent = (
    <View style={containerStyle}>
      <Ionicons
        name={isVerified ? 'shield-checkmark' : 'shield-outline'}
        size={iconSize}
        color={isVerified ? VERIFIED_COLOR : Colors.textMuted}
      />
      {shouldShowLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color: isVerified ? VERIFIED_COLOR : Colors.textMuted,
              marginLeft: 4,
            },
          ]}
        >
          {isVerified ? 'Verified' : 'Unverified'}
        </Text>
      )}
    </View>
  );

  if (!tappable) return badgeContent;

  return (
    <>
      <TouchableOpacity
        onPress={() => setTooltipVisible(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isVerified ? 'Verified profile — tap for details' : 'Unverified profile — tap for details'}
      >
        {badgeContent}
      </TouchableOpacity>

      {/* ── Tooltip bottom sheet ───────────────────────────────────────── */}
      <Modal
        visible={tooltipVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTooltipVisible(false)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close tooltip"
        />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {isVerified ? (
            <>
              {/* ── VERIFIED state ─────────────────────────────────────── */}
              <View style={styles.sheetIconRow}>
                <View style={[styles.sheetIconBg, { backgroundColor: VERIFIED_BG, borderColor: VERIFIED_BORDER }]}>
                  <Ionicons name="shield-checkmark" size={36} color={VERIFIED_COLOR} />
                </View>
              </View>
              <Text style={styles.sheetTitle}>This profile is verified ✓</Text>
              <Text style={styles.sheetBody}>
                This person completed our photo verification — they took a live selfie
                that matched their profile photos. Their face is real.{'\n\n'}
                Verification doesn't vouch for their intentions, but it does confirm
                they're a real human, not a bot or scammer using someone else's pictures.
              </Text>
              <View style={styles.sheetDivider} />
              <View style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.checkText}>Real person confirmed</Text>
              </View>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.checkText}>Photos match their face</Text>
              </View>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.checkText}>Completed pose-matching selfie</Text>
              </View>
            </>
          ) : (
            <>
              {/* ── UNVERIFIED state ───────────────────────────────────── */}
              <View style={styles.sheetIconRow}>
                <View style={[styles.sheetIconBg, { backgroundColor: Colors.warningLight, borderColor: Colors.warning + '40' }]}>
                  <Ionicons name="shield-outline" size={36} color={Colors.warning} />
                </View>
              </View>
              <Text style={styles.sheetTitle}>Not yet verified</Text>
              <Text style={styles.sheetBody}>
                This profile hasn't completed photo verification. That doesn't mean
                they're fake — many real people haven't done it yet.{'\n\n'}
                Verified profiles have confirmed their face matches their photos
                via a live selfie. Look for the blue shield on profiles you want to
                be sure about.
              </Text>
              <View style={styles.sheetDivider} />
              <View style={styles.checkRow}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
                <Text style={[styles.checkText, { color: Colors.textMuted }]}>No live selfie on file</Text>
              </View>
              <View style={styles.checkRow}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
                <Text style={[styles.checkText, { color: Colors.textMuted }]}>Photos not confirmed</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.sheetDismiss}
            onPress={() => setTooltipVisible(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tooltip"
          >
            <Text style={styles.sheetDismissText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Modal / sheet
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    ...Shadow.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetIconRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sheetIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  sheetBody: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sheetDismiss: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  sheetDismissText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
