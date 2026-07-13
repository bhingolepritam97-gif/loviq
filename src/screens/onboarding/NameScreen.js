import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import OnboardingHeader from '../../components/OnboardingHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const STEPS_TOTAL = 13;

export default function NameScreen({ navigation }) {
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();

  const isValid = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#FFF9FB', '#FFFFFF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={3}
        totalSteps={STEPS_TOTAL}
        title="Create Account"
      />

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What’s your name?</Text>
          <Text style={styles.subtitle}>This is how it will appear on Vela. You won't be able to change this later.</Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Input
            placeholder="First Name"
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoFocus
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={Colors.primary} />}
            rightIcon={name.length > 0 ? <Ionicons name="close-circle" size={20} color={Colors.textMuted} /> : null}
            onRightIconPress={() => setName('')}
          />
        </View>

        {/* Live Profile Card Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>PROFILE PREVIEW</Text>
          <LinearGradient
            colors={['#FF3A5C', '#FF6B35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardPreview}
          >
            <View style={styles.cardOverlay} />
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✨ New here</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName}>{name.trim() || 'Your Name'}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.cardDetail}>Active just now</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button
          label="Continue →"
          onPress={() => navigation.navigate('Birthday', { name: name.trim() })}
          disabled={!isValid}
        />
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: Spacing.xl 
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
  inputSection: { 
    marginBottom: Spacing['2xl'] 
  },
  previewContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  cardPreview: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.xl,
    position: 'relative',
    ...Shadow.md,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardHeader: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  cardFooter: {
    zIndex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    backgroundColor: '#E91E8C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardDetail: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  footer: { 
    paddingHorizontal: Spacing['2xl'], 
    paddingTop: Spacing.md, 
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
