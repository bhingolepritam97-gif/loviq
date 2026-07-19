import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { reportUser } from '../../services/UserService';

const REPORT_CATEGORIES = [
  { id: 'fake', label: 'Fake Profile / Spam', icon: 'ghost' },
  { id: 'harassment', label: 'Harassment or Bad Behavior', icon: 'warning' },
  { id: 'underage', label: 'Underage User', icon: 'person-remove' },
  { id: 'scam', label: 'Scam or Commercial', icon: 'cash' },
  { id: 'offline', label: 'Inappropriate Offline Behavior', icon: 'walk' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ReportUserScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const { matchId, matchName, matchProfileId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a reason for reporting.');
      return;
    }

    setSubmitting(true);
    const fullReason = `${selectedCategory.label} - ${details}`;
    const success = await reportUser(user?.uid, matchProfileId, fullReason);
    setSubmitting(false);

    if (success) {
      Alert.alert(
        'Report Submitted',
        `Thank you. We have received your report. You have been unmatched from ${matchName} and they have been blocked.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } else {
      Alert.alert('Error', 'There was an issue submitting your report. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <View style={styles.header}>
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Close" style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report {matchName}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>What's the reason for reporting?</Text>
        <Text style={styles.sectionSubtitle}>Your report is anonymous. We will investigate and take appropriate action.</Text>
        
        <View style={styles.categories}>
          {REPORT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select ${cat.label} category`}
              style={[styles.categoryCard, selectedCategory?.id === cat.id && styles.categoryCardSelected]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={24} 
                color={selectedCategory?.id === cat.id ? Colors.primary : Colors.textMuted} 
              />
              <Text style={[styles.categoryLabel, selectedCategory?.id === cat.id && styles.categoryLabelSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Please provide any additional context..."
          placeholderTextColor={Colors.border}
          multiline
          numberOfLines={4}
          value={details}
          onChangeText={setDetails}
          textAlignVertical="top"
        />

        <View style={styles.warningBox}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <Text style={styles.warningText}>Submitting a report will permanently unmatch you from {matchName} and block them.</Text>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Submit Report and Unmatch"
          style={[styles.submitBtn, (!selectedCategory || submitting) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={!selectedCategory || submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Report & Unmatch'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  scroll: { padding: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  
  categories: { gap: Spacing.md },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  categoryCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  categoryLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginLeft: Spacing.md },
  categoryLabelSelected: { color: Colors.primary },

  textInput: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, fontSize: 16, color: Colors.text, minHeight: 120 },
  
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '10', padding: Spacing.lg, borderRadius: Radius.md, marginTop: Spacing.xl },
  warningText: { flex: 1, marginLeft: Spacing.md, fontSize: 14, color: Colors.text, lineHeight: 20 },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { backgroundColor: Colors.error, paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', ...Shadow.md },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
