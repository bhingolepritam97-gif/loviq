import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import usePhotoUpload from '../../hooks/usePhotoUpload';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ManagePhotosScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useAuth();

  // Load the initial photo list from the user profile session
  // Wrap simple strings into the upload hook schema
  const initialPhotosSchema = (profile?.photos || []).map((uri, idx) => ({
    id: `photo-${idx}`,
    uri: uri,
    uploading: false,
    progress: 1.0,
    error: false,
    aiResults: { faceDetected: true, blurScore: 'Excellent', lightingScore: 'Excellent', smileDetected: idx === 0, passed: true },
  }));

  const {
    photos,
    setPhotos,
    isReorderMode,
    setIsReorderMode,
    selectedSwapIndex,
    setSelectedSwapIndex,
    startUpload,
    removePhoto,
    triggerSwap,
  } = usePhotoUpload(initialPhotosSchema);

  const [activeSlot, setActiveSlot] = useState(null);

  const handleAddPhoto = async (idx) => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant library permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      startUpload(uri, idx < photos.length ? idx : null);
    }
  };

  const handleCardPress = (idx) => {
    if (isReorderMode) {
      if (selectedSwapIndex === null) {
        setSelectedSwapIndex(idx);
      } else if (selectedSwapIndex === idx) {
        setSelectedSwapIndex(null);
      } else {
        triggerSwap(selectedSwapIndex, idx);
      }
    } else {
      // Toggle custom details or alert
      if (photos[idx]) {
        const ai = photos[idx].aiResults;
        if (ai) {
          const warningText = ai.warnings && ai.warnings.length > 0
            ? `\n\nAdvisories:\n• ${ai.warnings.join('\n• ')}`
            : '';
          Alert.alert(
            'AI Photo Audit 🤖',
            `Face Detected: ${ai.faceDetected ? 'Yes' : 'No'}\n` +
            `Lighting: ${ai.lightingScore}\n` +
            `Smile: ${ai.smileDetected ? 'Yes' : 'No'}\n` +
            `Resolution: ${ai.resolution || '1080x1440'}\n` +
            `Status: ${ai.warnings && ai.warnings.length > 0 ? 'Quality Advisory ⚠️' : 'Passed ✔'}${warningText}`
          );
        }
      }
    }
  };

  const handleSave = () => {
    // Check that we have at least 2 photos
    if (photos.length < 2) {
      Alert.alert('Gallery Requirement', 'You must have at least 2 photos to remain visible in discovery.');
      return;
    }
    // Map back to array of strings
    if (profile) {
      setProfile({
        ...profile,
        photos: photos.map(p => p.uri)
      });
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Photos</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} accessible={true} accessibilityLabel="Save photos" accessibilityRole="button">
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title instructions */}
        <View style={styles.infoSection}>
          <Text style={styles.mainHeader}>Manage your gallery</Text>
          <Text style={styles.subHeader}>
            {isReorderMode 
              ? "Select two photo slots to swap their positions."
              : "Tap any photo to run an AI photo health audit. Toggle reorder mode to swap positions."}
          </Text>
        </View>

        {/* Soft warning banner if main photo has quality issues */}
        {photos[0]?.aiResults?.warnings && photos[0].aiResults.warnings.length > 0 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningBannerTitle}>Main Photo Advisory</Text>
              <Text style={styles.warningBannerText}>
                {photos[0].aiResults.warnings[0]}
              </Text>
            </View>
          </View>
        )}

        {/* Toggle Mode Buttons */}
        <View style={styles.modeRow}>
          <TouchableOpacity 
            style={[styles.modeToggleBtn, isReorderMode && styles.activeModeToggleBtn]}
            onPress={() => {
              setIsReorderMode(!isReorderMode);
              setSelectedSwapIndex(null);
            }}
            accessible={true} accessibilityLabel="Toggle Swap Mode" accessibilityRole="button"
          >
            <Text style={[styles.modeToggleText, isReorderMode && styles.activeModeToggleText]}>
              {isReorderMode ? 'Swap Mode Active 🔄' : 'Enable Swap/Reorder'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2x3 Photo Grid */}
        <View style={styles.gridContainer}>
          {Array.from({ length: 6 }).map((_, idx) => {
            const photo = photos[idx];
            const isSelectedForSwap = selectedSwapIndex === idx;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                style={[
                  styles.slot,
                  isSelectedForSwap && styles.selectedSwapSlot,
                  photo?.uploading && styles.uploadingSlot,
                ]}
                onPress={() => handleCardPress(idx)}
                accessible={true} accessibilityLabel={`Photo slot ${idx + 1}`} accessibilityRole="button"
              >
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                    
                    {/* Index 0 is Main Badge */}
                    {idx === 0 && (
                      <View style={styles.mainBadge}>
                        <LinearGradient
                          colors={Gradients.primary.colors}
                          start={Gradients.primary.start}
                          end={Gradients.primary.end}
                          style={styles.mainBadgeGradient}
                        >
                          <Text style={styles.mainBadgeText}>⭐ Main</Text>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Delete button if not in reorder mode */}
                    {!isReorderMode && (
                      <TouchableOpacity 
                        style={styles.deleteBtn} 
                        onPress={() => removePhoto(idx)}
                        accessible={true} accessibilityLabel={`Delete photo ${idx + 1}`} accessibilityRole="button"
                      >
                        <Text style={styles.deleteText}>✕</Text>
                      </TouchableOpacity>
                    )}

                    {/* Reorder swap badge overlay */}
                    {isReorderMode && (
                      <View style={[styles.swapOverlay, isSelectedForSwap && styles.swapSelectedOverlay]}>
                        <Text style={styles.swapIconText}>{isSelectedForSwap ? 'Selected' : 'Tap to Swap'}</Text>
                      </View>
                    )}

                    {/* AI evaluation stamp icon */}
                    {photo.aiResults && !isReorderMode && (
                      <View style={[
                        styles.aiBadge,
                        photo.aiResults.warnings && photo.aiResults.warnings.length > 0 && styles.aiBadgeWarning
                      ]}>
                        <Text style={styles.aiBadgeText}>
                          {photo.aiResults.warnings && photo.aiResults.warnings.length > 0 ? '⚠️ Audit Alert' : '🤖 Audit Ok'}
                        </Text>
                      </View>
                    )}

                    {/* Progress Indicator for Uploads */}
                    {photo.uploading && (
                      <View style={styles.progressBox}>
                        <Text style={styles.progressPctText}>{Math.round(photo.progress * 100)}%</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addSlotContent} onPress={() => handleAddPhoto(idx)} accessible={true} accessibilityLabel={`Add photo to slot ${idx + 1}`} accessibilityRole="button">
                    <View style={styles.plusWrap}>
                      <Text style={styles.plusLarge}>+</Text>
                    </View>
                    <Text style={styles.addSlotLabel}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save footer */}
        <View style={styles.footerSpacing}>
          <Button label="Save Gallery" onPress={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
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

  modeRow: { marginBottom: Spacing.xl, flexDirection: 'row' },
  modeToggleBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  activeModeToggleBtn: { backgroundColor: Colors.primary },
  modeToggleText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  activeModeToggleText: { color: Colors.white },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
  slot: { width: '47%', aspectRatio: 0.75, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  selectedSwapSlot: { borderColor: Colors.primary, borderWidth: 3 },
  uploadingSlot: { opacity: 0.8 },
  photoContainer: { flex: 1, position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },

  mainBadge: { position: 'absolute', top: 8, left: 8, zIndex: 10, borderRadius: Radius.sm, overflow: 'hidden', ...Shadow.sm },
  mainBadgeGradient: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  mainBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },

  deleteBtn: { position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.md, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: Colors.white, fontSize: 10, fontWeight: '800' },

  swapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 5, justifyContent: 'center', alignItems: 'center' },
  swapSelectedOverlay: { backgroundColor: 'rgba(232, 98, 143, 0.4)' },
  swapIconText: { color: Colors.white, fontSize: 13, fontWeight: '800' },

  aiBadge: { position: 'absolute', bottom: 8, left: 8, zIndex: 10, backgroundColor: 'rgba(0, 196, 140, 0.85)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radius.sm },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white },

  progressBox: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20, justifyContent: 'center', alignItems: 'center' },
  progressPctText: { color: Colors.white, fontSize: 18, fontWeight: '800' },

  addSlotContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  plusWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  plusLarge: { fontSize: 26, color: Colors.primary, fontWeight: '800' },
  addSlotLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  footerSpacing: { marginTop: Spacing['2xl'] },

  // Warning Banner Styles
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#FFB800',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  warningEmoji: {
    fontSize: 22,
  },
  warningBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  warningBannerText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
    fontWeight: '500',
  },
  aiBadgeWarning: {
    backgroundColor: '#FFB800',
  },
});
