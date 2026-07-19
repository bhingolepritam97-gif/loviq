import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { submitAppeal } from '../../services/UserService';

export default function SuspensionScreen() {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, banReason, setIsBanned, setBanReason, setProfile } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Ban notice, 2: Appeal form, 3: Confirmation
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const userEmail = user?.email || 'your registered email';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsBanned(false);
      setBanReason('');
      setProfile(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleGoToAppeal = () => {
    setStep(2);
  };

  const handleSubmitAppeal = async () => {
    if (!explanation.trim()) {
      Alert.alert('Required', 'Please explain why you think this suspension was a mistake.');
      return;
    }
    
    setLoading(true);
    try {
      await submitAppeal(explanation);
      setStep(3);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scroll, 
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="ban" size={60} color="#EA4335" />
          </View>

          {step === 1 && (
            <>
              <Text style={styles.title}>Your account has been suspended</Text>
              <Text style={styles.reasonLabel}>Reason reported:</Text>
              <View style={styles.reasonCard}>
                <Text style={styles.reasonText}>{banReason || 'Violation of community guidelines.'}</Text>
              </View>
              
              <Text style={styles.description}>
                Your Lovly account was suspended for violating our Community Guidelines. This usually relates to suspicious activity, safety concerns, or behavior reported by other users.
              </Text>

              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={handleGoToAppeal}
                accessible={true} accessibilityLabel="Submit an Appeal" accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Submit an Appeal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Guidelines', 'Redirecting to Community Guidelines...')}
                accessible={true} accessibilityLabel="View Community Guidelines" accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>View Community Guidelines</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Submit an Appeal</Text>
              <Text style={styles.formLabel}>Tell us why you think this was a mistake</Text>
              
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                maxLength={500}
                placeholder="Explain the circumstances here (max 500 characters)..."
                placeholderTextColor={Colors.textMuted}
                value={explanation}
                onChangeText={setExplanation}
              />
              
              <Text style={styles.charCount}>{explanation.length}/500</Text>
              
              <Text style={styles.notice}>
                We review every appeal individually. You'll receive an email at <Text style={styles.bold}>{userEmail}</Text> once a decision is made.
              </Text>

              {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
              ) : (
                <TouchableOpacity 
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={handleSubmitAppeal}
                  accessible={true} accessibilityLabel="Submit Appeal" accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Submit</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => setStep(1)}
                accessible={true} accessibilityLabel="Go Back" accessibilityRole="button"
              >
                <Text style={styles.linkButtonText}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>Appeal Submitted</Text>
              
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={50} color="#34A853" />
              </View>

              <Text style={styles.description}>
                Thanks — your appeal has been submitted. We'll email you at <Text style={styles.bold}>{userEmail}</Text> within 3–5 business days with our decision. You won't be able to submit another appeal for this suspension while this one is under review.
              </Text>

              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={handleLogout}
                accessible={true} accessibilityLabel="Close App" accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Close App</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {step !== 3 && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            accessible={true} accessibilityLabel="Log Out" accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.errorLight || 'rgba(255, 71, 87, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIconContainer: {
    marginVertical: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.sansSerif,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: Colors.errorLight || 'rgba(255, 71, 87, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error + '33',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  textArea: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  notice: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  linkButton: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 6,
  },
});
