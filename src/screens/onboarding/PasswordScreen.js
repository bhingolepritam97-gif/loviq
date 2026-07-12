import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;

export default function PasswordScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const insets = useSafeAreaInsets();

  const isStrong = password.length >= 8;
  const isMatch = password === confirm && confirm.length > 0;
  const canContinue = isStrong && isMatch;

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', Colors.error, Colors.warning, Colors.success];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={3}
        totalSteps={STEPS_TOTAL}
        title="Security"
        subtitle="Step 3 of 3"
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>Create a password</Text>
        <Text style={styles.subtitle}>Make it something memorable — at least 8 characters.</Text>

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          rightIcon={<Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>}
          onRightIconPress={() => setShowPass(!showPass)}
          style={{ marginBottom: Spacing.lg }}
        />

        {/* Strength meter */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {[1, 2, 3].map(l => (
              <View key={l} style={[styles.strengthBar, { backgroundColor: l <= strength ? strengthColors[strength] : Colors.border }]} />
            ))}
            <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>{strengthLabels[strength]}</Text>
          </View>
        )}

        <Input
          label="Confirm Password"
          placeholder="••••••••"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPass}
          error={confirm.length > 0 && !isMatch ? "Passwords don't match" : ''}
          style={{ marginTop: Spacing.lg }}
        />

        <TouchableOpacity style={styles.skipRow} onPress={() => navigation.navigate('Name')}>
          <Text style={styles.skipText}>Skip (use OTP only)</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Continue →" onPress={() => navigation.navigate('Name')} disabled={!canContinue} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing['2xl'] },
  backIcon: { fontSize: 24, color: Colors.text },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Spacing['2xl'] },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', minWidth: 45, textAlign: 'right' },
  skipRow: { marginTop: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  skipText: { color: Colors.textMuted, fontSize: Typography.fontSize.sm, textDecorationLine: 'underline' },
  eyeIcon: { fontSize: 20 },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
