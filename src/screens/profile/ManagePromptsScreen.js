import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import AIBioSuggestions from '../../components/AIBioSuggestions';
import { useAuth } from '../../context/AuthContext';
import { fetchAiSuggestions } from '../../services/UserService';

const PREDEFINED_QUESTIONS = [
  'A random fact I love is...',
  'My Sunday looks like...',
  'The key to my heart is...',
  'I wind down by...',
  'We will get along if...',
  'My most irrational fear...',
];

export default function ManagePromptsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useAuth();
  
  // Local state for prompts loaded from session
  const [prompts, setPrompts] = useState(profile?.prompts || []);
  
  // Modal toggle states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Selection states for editor
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [replyText, setReplyText] = useState('');
  const [editingPromptId, setEditingPromptId] = useState(null);

  // AI Suggestions state
  const [aiSuggestionsVisible, setAiSuggestionsVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const handleGetPromptSuggestions = async () => {
    setAiSuggestionsVisible(true);
    setAiLoading(true);
    try {
      const suggestions = await fetchAiSuggestions({
        type: 'prompt',
        text: replyText,
        interests: profile?.interests || [],
        promptQuestion: selectedQuestion
      });
      setAiSuggestions(suggestions);
    } catch (err) {
      console.warn('Failed to get prompt suggestions:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (prompts.length >= 3) {
      Alert.alert('Prompt Limit Reached', 'You can display a maximum of 3 prompts on your profile.');
      return;
    }
    // Filter out questions we already answered
    const unanswered = PREDEFINED_QUESTIONS.find(q => !prompts.some(p => p.question === q));
    setSelectedQuestion(unanswered || PREDEFINED_QUESTIONS[0]);
    setReplyText('');
    setShowAddModal(true);
  };

  const handleAddPrompt = () => {
    if (!replyText.trim()) {
      Alert.alert('Empty Reply', 'Please write a reply to your selected prompt.');
      return;
    }

    const newPrompt = {
      id: `prompt-${Date.now()}`,
      question: selectedQuestion,
      reply: replyText.trim(),
    };

    const updated = [...prompts, newPrompt];
    setPrompts(updated);
    setShowAddModal(false);
  };

  const handleOpenEdit = (prompt) => {
    setEditingPromptId(prompt.id);
    setSelectedQuestion(prompt.question);
    setReplyText(prompt.reply);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!replyText.trim()) {
      Alert.alert('Empty Reply', 'Reply cannot be blank.');
      return;
    }

    const updated = prompts.map(p => p.id === editingPromptId ? { ...p, reply: replyText.trim() } : p);
    setPrompts(updated);
    setShowEditModal(false);
  };

  const handleDeletePrompt = (id) => {
    Alert.alert(
      'Remove Prompt',
      'Are you sure you want to delete this prompt from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            const updated = prompts.filter(p => p.id !== id);
            setPrompts(updated);
          }
        }
      ]
    );
  };

  const handleSaveAll = () => {
    if (profile) {
      setProfile({
        ...profile,
        prompts
      });
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Prompts</Text>
        <TouchableOpacity onPress={handleSaveAll} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title and details */}
        <View style={styles.infoSection}>
          <Text style={styles.mainHeader}>Profile Prompts</Text>
          <Text style={styles.subHeader}>
            Add up to three prompts to help others get to know you. Others can like or reply to your prompts to start a chat!
          </Text>
        </View>

        {/* Prompt List */}
        <View style={styles.promptList}>
          {prompts.map((prompt) => (
            <View key={prompt.id} style={styles.promptCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.questionLabel}>Question</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(prompt)}>
                    <Text style={styles.actionEmoji}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteAction]} onPress={() => handleDeletePrompt(prompt.id)}>
                    <Text style={styles.actionEmoji}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.promptQuestion}>{prompt.question}</Text>
              <Text style={styles.promptReply}>"{prompt.reply}"</Text>
            </View>
          ))}

          {/* Empty Add prompt slot */}
          {prompts.length < 3 && (
            <TouchableOpacity style={styles.addSlot} onPress={handleOpenAdd} activeOpacity={0.8}>
              <View style={styles.plusCircle}>
                <Text style={styles.plusText}>+</Text>
              </View>
              <Text style={styles.addText}>Add Profile Prompt</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save CTA */}
        <View style={styles.footerSpacing}>
          <Button label="Save Changes" onPress={handleSaveAll} />
        </View>
      </ScrollView>

      {/* ================= MODAL: ADD PROMPT ================= */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Prompt</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.questionsSelector} showsVerticalScrollIndicator={false}>
              {PREDEFINED_QUESTIONS.map((q) => {
                const isSelected = selectedQuestion === q;
                const isAlreadyUsed = prompts.some(p => p.question === q);
                
                return (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.questionOption,
                      isSelected && styles.selectedQuestionOption,
                      isAlreadyUsed && styles.disabledQuestionOption
                    ]}
                    onPress={() => !isAlreadyUsed && setSelectedQuestion(q)}
                    disabled={isAlreadyUsed}
                  >
                    <Text style={[styles.questionOptionText, isSelected && styles.selectedQuestionOptionText, isAlreadyUsed && styles.disabledQuestionOptionText]}>
                      {q} {isAlreadyUsed && '(Used)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.replyBox}>
              <View style={styles.replyHeaderRow}>
                <Text style={styles.inputLabel}>Your Answer</Text>
                <TouchableOpacity
                  id="add-prompt-ai-writer-btn"
                  onPress={handleGetPromptSuggestions}
                  style={styles.aiWriterBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiWriterBtnText}>✨ Help me write</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.replyInput}
                placeholder="Write your answer..."
                value={replyText}
                onChangeText={setReplyText}
                maxLength={150}
                multiline
              />
              <Text style={styles.charCount}>{replyText.length} / 150</Text>
            </View>

            <Button label="Add Prompt to Profile" onPress={handleAddPrompt} />
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: EDIT PROMPT ================= */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Prompt</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editQuestionBox}>
              <Text style={styles.editQuestionLabel}>Prompt Question</Text>
              <Text style={styles.editQuestionText}>{selectedQuestion}</Text>
            </View>

            <View style={styles.replyBox}>
              <View style={styles.replyHeaderRow}>
                <Text style={styles.inputLabel}>Your Answer</Text>
                <TouchableOpacity
                  id="edit-prompt-ai-writer-btn"
                  onPress={handleGetPromptSuggestions}
                  style={styles.aiWriterBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiWriterBtnText}>✨ Help me write</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.replyInput}
                placeholder="Write your answer..."
                value={replyText}
                onChangeText={setReplyText}
                maxLength={150}
                multiline
              />
              <Text style={styles.charCount}>{replyText.length} / 150</Text>
            </View>

            <Button label="Save Changes" onPress={handleSaveEdit} />
          </View>
        </View>
      </Modal>

      {/* AI Writer bottom sheet */}
      <AIBioSuggestions
        visible={aiSuggestionsVisible}
        onClose={() => setAiSuggestionsVisible(false)}
        suggestions={aiSuggestions}
        onSelect={(val) => setReplyText(val)}
        loading={aiLoading}
        type="prompt"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 24, fontWeight: '800', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  saveBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.primary, borderRadius: Radius.full, ...Shadow.sm },
  saveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: '700' },

  scroll: { padding: Spacing.xl, paddingBottom: 60 },
  infoSection: { marginBottom: Spacing.xl },
  mainHeader: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 6 },
  subHeader: { fontSize: 14, color: Colors.textMuted, lineHeight: 20 },

  promptList: { gap: Spacing.md },
  promptCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderHorizontalWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  questionLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1.0, textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  deleteAction: { borderColor: Colors.error + '25' },
  actionEmoji: { fontSize: 13 },
  promptQuestion: { fontSize: Typography.fontSize.base, fontWeight: '800', color: Colors.text, letterSpacing: -0.2, marginBottom: Spacing.sm },
  promptReply: { fontSize: Typography.fontSize.base, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 22 },

  addSlot: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  plusCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  plusText: { fontSize: 20, color: Colors.primary, fontWeight: '700' },
  addText: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textMuted },

  footerSpacing: { marginTop: Spacing['2xl'] },

  // Modals styling
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  modalCloseText: { color: Colors.textMuted, fontSize: Typography.fontSize.sm, fontWeight: '600' },

  questionsSelector: { maxHeight: 150, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.sm },
  questionOption: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border },
  selectedQuestionOption: { backgroundColor: Colors.primary + '08' },
  disabledQuestionOption: { opacity: 0.4 },
  questionOptionText: { fontSize: Typography.fontSize.sm, color: Colors.text, fontWeight: '600' },
  selectedQuestionOptionText: { color: Colors.primary, fontWeight: '700' },
  disabledQuestionOptionText: { color: Colors.textMuted },

  replyBox: { marginBottom: Spacing.xl },
  inputLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: Spacing.xs },
  replyInput: { minHeight: 80, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, textAlignVertical: 'top', color: Colors.text, fontSize: 15, backgroundColor: Colors.background },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: Spacing.xs },

  editQuestionBox: { marginBottom: Spacing.xl, backgroundColor: Colors.background, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  editQuestionLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: Spacing.xs },
  editQuestionText: { fontSize: 15, fontWeight: '800', color: Colors.text },

  // AI suggestions button styles
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  aiWriterBtn: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  aiWriterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
});
