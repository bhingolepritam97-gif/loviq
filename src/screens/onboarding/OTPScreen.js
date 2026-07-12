import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';

const STEPS_TOTAL = 12;
const CODE_LENGTH = 6;

export default function OTPScreen({ route, navigation }) {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const insets = useSafeAreaInsets();

  const isComplete = code.every(c => c !== '');

  const handleChange = (val, idx) => {
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    setError('');
    if (val && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const [loading, setLoading] = useState(false);
  const { confirmationResult, phone, isMock, email } = route.params || {};

  const handleVerify = async () => {
    const enteredCode = code.join('');
    setError('');
    
    if (isMock) {
      if (enteredCode === '123456') {
        navigation.navigate('Password', { phone, email, isMock });
      } else {
        setError('Incorrect code. Try 123456 for this demo.');
        setCode(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
      return;
    }

    if (confirmationResult) {
      try {
        setLoading(true);
        await confirmationResult.confirm(enteredCode);
        // On success, Firebase Auth Context will automatically redirect
      } catch (err) {
        console.error(err);
        setError('Invalid verification code. Please try again.');
        setCode(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    } else {
      setError('Session expired. Please request a new code.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={2}
        totalSteps={STEPS_TOTAL}
        title="Verification"
        subtitle="Step 2 of 3"
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to your number. {'\n'}(Use 123456 for this demo)</Text>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={r => (inputRefs.current[idx] = r)}
              style={[styles.codeBox, digit && styles.codeBoxFilled, error && styles.codeBoxError]}
              value={digit}
              onChangeText={v => handleChange(v, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor={Colors.primary}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get it? </Text>
          <Text style={styles.resendLink}>Resend Code</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button label="Verify →" onPress={handleVerify} disabled={!isComplete} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg },
  backBtn: { marginBottom: Spacing['2xl'] },
  backIcon: { fontSize: 24, color: Colors.text },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: -0.8 },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted, lineHeight: 24, marginBottom: Spacing['3xl'] },
  codeRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.xl },
  codeBox: {
    width: 44, height: 56, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, fontSize: Typography.fontSize.xl,
    fontWeight: '700', color: Colors.text, ...Shadow.sm,
  },
  codeBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  codeBoxError: { borderColor: Colors.error },
  error: { textAlign: 'center', color: Colors.error, fontSize: Typography.fontSize.sm, marginBottom: Spacing.base },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  resendText: { color: Colors.textMuted, fontSize: Typography.fontSize.sm },
  resendLink: { color: Colors.primary, fontWeight: '700', fontSize: Typography.fontSize.sm },
  footer: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md },
});
