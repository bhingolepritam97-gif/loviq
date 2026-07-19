import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { safetyService } from '../../api/safety';

interface ReportModalProps {
  visible: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onReportSuccess: () => void;
  onBlockSuccess: () => void;
}

const REPORT_REASONS = [
  'Inappropriate Content',
  'Spam or Fake Profile',
  'Harassment or Offensive Behavior',
  'Underage User',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  userId,
  userName,
  onClose,
  onReportSuccess,
  onBlockSuccess
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'menu' | 'report'>('menu'); // 'menu' shows Block/Report options

  const handleBlock = async () => {
    Alert.alert(
      `Block ${userName}?`,
      `You won't see them, and they won't see you. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await safetyService.blockUser(userId);
              onBlockSuccess();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to block user.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReportSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason.');
      return;
    }
    
    setLoading(true);
    try {
      await safetyService.reportUser(userId, selectedReason, details);
      onReportSuccess();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setMode('menu');
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.header}>
                {mode === 'report' ? (
                  <TouchableOpacity onPress={() => setMode('menu')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={(theme.colors as any).text} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 24 }} /> // spacer
                )}
                <Text style={styles.title}>
                  {mode === 'menu' ? 'Safety Options' : `Report ${userName}`}
                </Text>
                <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={(theme.colors as any).textMuted} />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              ) : mode === 'menu' ? (
                <View style={styles.menuContainer}>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => setMode('report')}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Report User"
                  >
                    <Ionicons name="flag-outline" size={24} color={theme.colors.error} />
                    <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Report {userName}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.divider} />

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={handleBlock}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Block User"
                  >
                    <Ionicons name="shield-outline" size={24} color={(theme.colors as any).text} />
                    <Text style={styles.menuItemText}>Block {userName}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.reportContainer}>
                  <Text style={styles.subtitle}>Why are you reporting this user?</Text>
                  
                  {REPORT_REASONS.map(reason => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonButton,
                        selectedReason === reason && styles.selectedReasonButton
                      ]}
                      onPress={() => setSelectedReason(reason)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select reason: ${reason}`}
                    >
                      <Text style={[
                        styles.reasonText,
                        selectedReason === reason && styles.selectedReasonText
                      ]}>
                        {reason}
                      </Text>
                      {selectedReason === reason && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <TextInput
                    style={styles.input}
                    placeholder="Additional details (optional)"
                    placeholderTextColor={(theme.colors as any).textMuted}
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    maxLength={500}
                    accessible={true}
                    accessibilityLabel="Additional report details"
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
                    onPress={handleReportSubmit}
                    disabled={!selectedReason}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Submit Report"
                  >
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: theme.typography.fontFamily.serif,
    color: (theme.colors as any).text,
  },
  backButton: {
    padding: 5,
  },
  closeButton: {
    padding: 5,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: (theme.colors as any).text,
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 5,
  },
  reportContainer: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: (theme.colors as any).textMuted,
    marginBottom: 15,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  selectedReasonButton: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: (theme.colors as any).text,
  },
  selectedReasonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 20,
    color: (theme.colors as any).text,
    fontSize: 15,
    fontWeight: '400' as const,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.surface,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: (theme.colors as any).textMuted,
    marginTop: 15,
  }
});
