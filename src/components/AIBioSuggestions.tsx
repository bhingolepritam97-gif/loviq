/**
 * AIBioSuggestions.js
 *
 * Bottom sheet modal displaying AI-generated bio or prompt-answer suggestions.
 * Renders 3 suggestions in custom interactive cards.
 * Clicking a suggestion selects it and calls onSelect(suggestion).
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

import { ResponsiveContainer } from '../core/responsive';

export default function AIBioSuggestions({
  visible,
  onClose,
  suggestions = [],
  onSelect,
  loading = false,
  type = 'bio',
}) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback 
        onPress={onClose}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close backdrop"
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Content area"
          >
            <ResponsiveContainer safeArea={false} centered={true} maxWidth={540} style={styles.sheetContainer}>
              <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
              {/* Grab handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.robotIcon}>
                    <Text style={styles.robotIconText}>🤖</Text>
                  </View>
                  <View>
                    <Text style={styles.title}>AI Writer Assistant</Text>
                    <Text style={styles.subtitle}>
                      {type === 'bio' ? 'Suggesting warm, specific bios' : 'Suggesting prompt completions'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeBtn}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close AI suggestions"
                >
                  <Ionicons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Polishing suggestions...</Text>
                </View>
              ) : suggestions.length === 0 ? (
                <View style={styles.loadingWrap}>
                  <Text style={styles.noSuggestionsText}>
                    No suggestions found. Try adding some interests or starting your draft.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.sectionHeader}>Choose a suggestion to fill the field:</Text>
                  
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      id={`ai-suggestion-item-${index}`}
                      style={styles.suggestionCard}
                      onPress={() => {
                        onSelect(suggestion);
                        onClose();
                      }}
                      activeOpacity={0.8}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Use suggestion: ${suggestion}`}
                    >
                      <Text style={styles.suggestionText}>"{suggestion}"</Text>
                      <View style={styles.cardFooter}>
                        <View style={styles.charCountRow}>
                          <Text style={styles.charCountText}>{suggestion.length} chars</Text>
                        </View>
                        <View style={styles.usePill}>
                          <Text style={styles.usePillText}>Use suggestion</Text>
                          <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ResponsiveContainer>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 32, 46, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '75%',
    width: '100%',
    paddingTop: Spacing.md,
    ...Shadow.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  robotIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotIconText: { fontSize: 20 },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCountText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  usePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
