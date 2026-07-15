import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const FAQS = [
  {
    q: "How does matching work on Vela?",
    a: "Vela works on mutual interest. Swipe right to like someone, or left to pass. If they swipe right on you too, it's a match! You'll then be able to start chatting instantly."
  },
  {
    q: "What is Vela Gold and what does it include?",
    a: "Vela Gold is our premium subscription. It unlocks exclusive benefits including unlimited swipes, seeing who liked you in your Likes tab, rewinding accidental passes, and profile boosts."
  },
  {
    q: "How do I verify my profile photos?",
    a: "Go to your Profile tab, tap 'Photo Verification', and follow the instructions to capture a quick selfie video. Our team will verify your submission and award you a verified checkmark badge."
  },
  {
    q: "How do I block or report an account?",
    a: "Safety is our priority. You can block or report anyone directly from their profile detail page, or by tapping the options menu inside a conversation. Once blocked, you'll never see them again."
  }
];

export default function SupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Incomplete Form', 'Please enter a subject and describe your issue.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user?.uid || 'anonymous',
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        createdAt: new Date().toISOString()
      });

      Alert.alert('Ticket Submitted', 'Thank you! Our support team has received your ticket and will respond shortly.');
      setSubject('');
      setDescription('');
      navigation.goBack();
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      Alert.alert('Error', 'Unable to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity 
                onPress={() => toggleExpand(index)} 
                activeOpacity={0.7}
                style={styles.faqQuestionRow}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={Colors.textMuted} 
                />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Contact Form */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Contact Support</Text>
        <Text style={styles.formSubtitle}>Can't find what you need? Open a support ticket below.</Text>

        <TextInput 
          style={styles.input}
          placeholder="Subject"
          placeholderTextColor={Colors.textMuted}
          value={subject}
          onChangeText={setSubject}
        />

        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue or feedback in detail..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmitTicket}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Ticket</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.lg, 
    height: 60, 
    backgroundColor: Colors.background, 
    borderBottomWidth: 1, 
    borderColor: Colors.border 
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  formSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.md },
  faqCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.md, 
    marginBottom: Spacing.sm, 
    borderWidth: 1, 
    borderColor: Colors.border,
    overflow: 'hidden'
  },
  faqQuestionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.md 
  },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  faqAnswerContainer: { 
    padding: Spacing.md, 
    paddingTop: 0, 
    borderTopWidth: 1, 
    borderColor: Colors.border + '50' 
  },
  faqAnswer: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  input: { 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: Radius.md, 
    padding: Spacing.md, 
    fontSize: 14, 
    color: Colors.text,
    marginBottom: Spacing.sm
  },
  textArea: { height: 120 },
  submitBtn: { 
    backgroundColor: Colors.primary, 
    paddingVertical: Spacing.md, 
    borderRadius: Radius.full, 
    alignItems: 'center', 
    marginTop: Spacing.md,
    ...Shadow.sm
  },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 }
});
