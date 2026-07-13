import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/UserService';
import { Alert } from 'react-native';

export default function EditProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, user } = useAuth();
  
  // Local state for profile inputs
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [job, setJob] = useState(profile?.job || 'Product Designer');
  const [school, setSchool] = useState(profile?.school || 'NYU');
  const [intent, setIntent] = useState(profile?.intent || 'Long-term');
  
  // Listen to updates from ManagePhotos and ManagePrompts screens
  const [photos, setPhotos] = useState(profile?.photos || []);
  const [prompts, setPrompts] = useState(profile?.prompts || []);

  useEffect(() => {
    // When returning from photo or prompt editing, reload the updated session states
    const unsubscribe = navigation.addListener('focus', () => {
      if (profile) {
        setPhotos([...(profile.photos || [])]);
        setPrompts([...(profile.prompts || [])]);
      }
    });
    return unsubscribe;
  }, [navigation, profile]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const updatedData = {
      name,
      bio,
      job,
      school,
      intent,
      photos,
      prompts
    };
    try {
      await updateUserProfile(user.uid, updatedData);
      setProfile({
        ...profile,
        ...updatedData
      });
      navigation.goBack();
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* SECTION: PHOTOS HUB CARD */}
        <TouchableOpacity 
          style={styles.sectionCard} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('ManagePhotos')}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🖼️</Text>
              <Text style={styles.sectionTitle}>PHOTOS</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          <View style={styles.photosPreviewGrid}>
            {Array.from({ length: 6 }).map((_, idx) => {
              const photo = photos[idx];
              return (
                <View key={idx} style={styles.photoThumbSlot}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.photoThumb} />
                  ) : (
                    <View style={styles.emptyPhotoThumbSlot}>
                      <Text style={styles.plusSign}>+</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        {/* SECTION: BIO CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📝</Text>
              <Text style={styles.sectionTitle}>BIO</Text>
            </View>
          </View>
          <Input
            placeholder="Write something interesting about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            maxLength={250}
            style={styles.bioInput}
          />
        </View>

        {/* SECTION: PROMPTS CARD */}
        <TouchableOpacity 
          style={styles.sectionCard} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('ManagePrompts')}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎙️</Text>
              <Text style={styles.sectionTitle}>PROFILE PROMPTS</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          
          {prompts.length === 0 ? (
            <View style={styles.emptyPromptsBox}>
              <Text style={styles.emptyPromptsText}>Add prompts to stand out and invite conversations.</Text>
            </View>
          ) : (
            <View style={styles.promptsPreviewList}>
              {prompts.map((prompt) => (
                <View key={prompt.id} style={styles.promptPreviewItem}>
                  <Text style={styles.promptQuestionPreview}>{prompt.question}</Text>
                  <Text style={styles.promptReplyPreview} numberOfLines={2}>"{prompt.reply}"</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* SECTION: BASIC INFO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>👤</Text>
              <Text style={styles.sectionTitle}>BASIC INFO</Text>
            </View>
          </View>
          
          <Input
            label="First Name"
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.infoInput}
          />
          <Input
            label="Job Title"
            placeholder="e.g. Designer"
            value={job}
            onChangeText={setJob}
            style={styles.infoInput}
          />
          <Input
            label="School / University"
            placeholder="e.g. Stanford University"
            value={school}
            onChangeText={setSchool}
            style={styles.infoInput}
          />
        </View>

        {/* SECTION: DATING INTENT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🎯</Text>
              <Text style={styles.sectionTitle}>DATING INTENT</Text>
            </View>
          </View>
          <View style={styles.intentGrid}>
            {['Long-term', 'Long-term, open to short', 'Short-term, open to long', 'Short-term', 'New friends', 'Still figuring it out'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.intentPill, intent === item && styles.intentPillActive]}
                onPress={() => setIntent(item)}
              >
                <Text style={[styles.intentText, intent === item && styles.intentTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, backgroundColor: Colors.surface, zIndex: 10, ...Shadow.sm },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  saveBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  saveText: { fontSize: Typography.fontSize.base, color: Colors.primary, fontWeight: '800' },
  
  scroll: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 80 },
  
  sectionCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.2 },
  arrowIcon: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },

  photosPreviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumbSlot: { width: '31%', aspectRatio: 0.75, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.border },
  photoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyPhotoThumbSlot: { flex: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md },
  plusSign: { fontSize: 20, color: Colors.textMuted },

  bioInput: { marginTop: Spacing.xs, minHeight: 80 },

  emptyPromptsBox: { padding: Spacing.md, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, alignItems: 'center' },
  emptyPromptsText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  promptsPreviewList: { gap: Spacing.md },
  promptPreviewItem: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  promptQuestionPreview: { fontSize: 12, fontWeight: '800', color: Colors.primary, uppercase: true, letterSpacing: 0.5, marginBottom: Spacing.xs },
  promptReplyPreview: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 20 },

  infoInput: { marginBottom: Spacing.md },

  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  intentPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  intentPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  intentText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  intentTextActive: { color: Colors.primary, fontWeight: '700' },
});
