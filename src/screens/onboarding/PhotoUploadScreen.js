import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Typography, Spacing, Radius } from '../../theme';
import OnboardingHeader from '../../components/OnboardingHeader';
import PhotoGrid from '../../components/PhotoGrid';
import StickyFooter from '../../components/StickyFooter';
import usePhotoUpload from '../../hooks/usePhotoUpload';
import * as ImageService from '../../services/ImageService';

const MAX_PHOTOS = 6;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_MAX_WIDTH = 600;
const CONTAINER_WIDTH = SCREEN_WIDTH > CONTAINER_MAX_WIDTH ? CONTAINER_MAX_WIDTH : SCREEN_WIDTH;
const GRID_PADDING = Spacing.lg; // 20
const GRID_GAP = 10; // Clean tight layout gap (10px)

// Dynamic 3-column sizing
const CARD_WIDTH = (CONTAINER_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH / 0.78; // Reduced height (approx 15-20% shorter)

export default function PhotoUploadScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true, interestedIn: [], intent: '', interests: [], bio: '' };
  const insets = useSafeAreaInsets();
  const {
    photos,
    activeSlot,
    setActiveSlot,
    isReorderMode,
    setIsReorderMode,
    selectedSwapIndex,
    setSelectedSwapIndex,
    startUpload,
    removePhoto,
    triggerSwap,
  } = usePhotoUpload([
    {
      id: 'photo-1',
      uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600',
      aiResults: { faceDetected: true, blurScore: 'Excellent', lightingScore: 'Excellent', smileDetected: true, passed: true },
      uploading: false,
      progress: 1.0,
      error: false,
    },
    {
      id: 'photo-2',
      uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
      aiResults: { faceDetected: true, blurScore: 'Excellent', lightingScore: 'Good Lighting', smileDetected: false, passed: true },
      uploading: false,
      progress: 1.0,
      error: false,
    }
  ]);

  const [showPickerSheet, setShowPickerSheet] = useState(false);
  const [selectedPhotoForDetails, setSelectedPhotoForDetails] = useState(null);

  // Reanimated values for opening screen
  const headerScale = useSharedValue(0.95);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const handleSelectImageSource = async (source) => {
    setShowPickerSheet(false);
    const hasPermission = await ImageService.requestCameraAndGalleryPermissions();
    if (!hasPermission) return;

    let result;
    try {
      if (source === 'camera') {
        result = await ImageService.takePhotoWithCamera();
      } else {
        result = await ImageService.pickImageFromLibrary();
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        startUpload(uri, activeSlot);
      }
    } catch (err) {
      console.log('Error picking image: ', err);
      Alert.alert('Upload Error', 'Something went wrong while selecting your photo. Please try again.');
    }
  };

  const handleCardPress = useCallback((idx) => {
    if (isReorderMode) {
      if (selectedSwapIndex === null) {
        setSelectedSwapIndex(idx);
      } else if (selectedSwapIndex === idx) {
        setSelectedSwapIndex(null);
      } else {
        triggerSwap(selectedSwapIndex, idx);
      }
    } else {
      const photo = photos[idx];
      if (photo) {
        setSelectedPhotoForDetails(photo);
      } else {
        setActiveSlot(idx);
        setShowPickerSheet(true);
      }
    }
  }, [isReorderMode, selectedSwapIndex, photos, triggerSwap, setSelectedSwapIndex, setActiveSlot]);

  const handleRemovePhoto = useCallback((idx) => {
    if (photos.length <= 2) {
      Alert.alert(
        'Minimum Photos Required',
        'To build a genuine dating profile and unlock matches, Loviq requires at least 2 photos.',
        [{ text: 'OK' }]
      );
      return;
    }
    removePhoto(idx);
  }, [photos, removePhoto]);

  return (
    <View style={styles.container}>
      {/* Step & Progress Header */}
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={11}
        totalSteps={12}
        title="Build Profile"
        subtitle="Step 6 of 6"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.introContainer, headerAnimatedStyle]}>
            <Text style={styles.title}>Build Profile</Text>
            <Text style={styles.subtitle}>Show your best self</Text>
          </Animated.View>

          {/* Action Row containing drag label & Swap button */}
          <View style={styles.actionRow}>
            <Text style={styles.hintText}>📸 Hold and drag to reorder photos.</Text>
            {photos.length >= 2 && (
              <TouchableOpacity
                onPress={() => {
                  setIsReorderMode(!isReorderMode);
                  setSelectedSwapIndex(null);
                }}
                style={[styles.swapToggle, isReorderMode && styles.swapToggleActive]}
                accessibilityLabel="Toggle swap reordering mode"
                accessibilityRole="button"
              >
                <Text style={[styles.swapToggleText, isReorderMode && styles.swapToggleTextActive]}>
                  {isReorderMode ? 'Done' : '⇄ Swap'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isReorderMode && (
            <View style={styles.reorderBanner}>
              <Text style={styles.reorderBannerText}>
                {selectedSwapIndex === null
                  ? 'Select a photo to swap positions'
                  : 'Select second photo to perform swap'}
              </Text>
            </View>
          )}

          <PhotoGrid
            photos={photos}
            isReorderMode={isReorderMode}
            selectedSwapIndex={selectedSwapIndex}
            onCardPress={handleCardPress}
            onRemovePhoto={handleRemovePhoto}
            cardWidth={CARD_WIDTH}
            cardHeight={CARD_HEIGHT}
            maxPhotos={MAX_PHOTOS}
          />

          {/* Dynamic Bottom Encouragement Guidance */}
          {photos.length >= 2 ? (
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceTitle}>Your profile is looking great! ✨</Text>
              <Text style={styles.guidanceText}>
                Add 2 more photos to get up to 3× more matches.
              </Text>
            </View>
          ) : (
            <Text style={styles.qualityHint}>
              🔒 Your photos are analyzed locally to ensure clear lighting and visibility.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Premium Footer */}
      <StickyFooter
        photosCount={photos.length}
        maxPhotos={MAX_PHOTOS}
        onContinue={() => navigation.navigate('LocationPermission', { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio, photos: photos.map(p => p.uri) })}
        insets={insets}
      />

      {/* Photo Picker Sheet Modal */}
      <Modal
        visible={showPickerSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerSheet(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPickerSheet(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerSheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.pickerSheetTitle}>Add a Photo</Text>
              <Text style={styles.pickerSheetSubtitle}>Upload high quality portrait photos for 3x more matches</Text>
            </View>
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerOption} onPress={() => handleSelectImageSource('library')}>
                <Text style={styles.pickerOptionEmoji}>🖼️</Text>
                <Text style={styles.pickerOptionText}>Choose from Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerOption} onPress={() => handleSelectImageSource('camera')}>
                <Text style={styles.pickerOptionEmoji}>📸</Text>
                <Text style={styles.pickerOptionText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowPickerSheet(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI Photo Details Modal (Quality feedback checks) */}
      <Modal
        visible={selectedPhotoForDetails !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoForDetails(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedPhotoForDetails(null)}>
          <View style={styles.aiDetailsCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.aiModalTitle}>AI Quality Feedback</Text>
            {selectedPhotoForDetails && selectedPhotoForDetails.aiResults ? (
              <View style={styles.aiModalContent}>
                <Image source={{ uri: selectedPhotoForDetails.uri }} style={styles.aiModalPreview} />
                
                <View style={styles.aiMetricRow}>
                  <Text style={styles.aiMetricLabel}>✓ Face detected</Text>
                  <Text style={[styles.aiMetricValue, selectedPhotoForDetails.aiResults.faceDetected ? styles.metricGreen : styles.metricRed]}>
                    {selectedPhotoForDetails.aiResults.faceDetected ? 'Optimal' : 'Not Detected'}
                  </Text>
                </View>

                <View style={styles.aiMetricRow}>
                  <Text style={styles.aiMetricLabel}>✓ Good lighting</Text>
                  <Text style={[styles.aiMetricValue, selectedPhotoForDetails.aiResults.lightingScore === 'Too Dark' ? styles.metricRed : styles.metricGreen]}>
                    {selectedPhotoForDetails.aiResults.lightingScore}
                  </Text>
                </View>

                <View style={styles.aiMetricRow}>
                  <Text style={styles.aiMetricLabel}>✓ Sharp image</Text>
                  <Text style={[styles.aiMetricValue, selectedPhotoForDetails.aiResults.blurScore === 'Blurry' ? styles.metricRed : styles.metricGreen]}>
                    {selectedPhotoForDetails.aiResults.blurScore}
                  </Text>
                </View>

                <View style={styles.aiMetricRow}>
                  <Text style={styles.aiMetricLabel}>✓ Smile verified</Text>
                  <Text style={[styles.aiMetricValue, selectedPhotoForDetails.aiResults.smileDetected ? styles.metricGold : styles.metricGray]}>
                    {selectedPhotoForDetails.aiResults.smileDetected ? 'Detected' : 'Neutral'}
                  </Text>
                </View>

                {selectedPhotoForDetails.aiResults.isDuplicate && (
                  <View style={styles.aiWarningRow}>
                    <Text style={styles.aiWarningText}>⚠️ Duplicate photo detected</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.aiModalCloseButton}
                  onPress={() => setSelectedPhotoForDetails(null)}
                >
                  <Text style={styles.aiModalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ActivityIndicator color={Colors.primary} size="large" />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 150,
  },
  contentContainer: {
    width: '100%',
    maxWidth: CONTAINER_MAX_WIDTH,
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.md,
  },
  introContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.text,
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  swapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  swapToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  swapToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
  },
  swapToggleTextActive: {
    color: Colors.white,
  },
  reorderBanner: {
    backgroundColor: '#FFE6F0',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB3D1',
  },
  reorderBannerText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  qualityHint: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
    lineHeight: 16,
    paddingHorizontal: Spacing.lg,
  },
  guidanceBox: {
    marginTop: Spacing.xl,
    backgroundColor: '#F5F5FA',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guidanceTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  guidanceText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  pickerSheetHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  pickerSheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  pickerSheetSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  pickerButtons: {
    gap: Spacing.md,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOptionEmoji: {
    fontSize: 22,
    marginRight: Spacing.md,
  },
  pickerOptionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  pickerCancel: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pickerCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  aiDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    width: CONTAINER_WIDTH * 0.85,
    alignSelf: 'center',
    top: '25%',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  aiModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  aiModalContent: {
    alignItems: 'center',
  },
  aiModalPreview: {
    width: 140,
    height: 180,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  aiMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aiMetricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  aiMetricValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  metricGreen: {
    color: '#00C48C',
  },
  metricRed: {
    color: Colors.error,
  },
  metricGold: {
    color: Colors.gold,
  },
  metricGray: {
    color: Colors.textMuted,
  },
  aiWarningRow: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  aiWarningText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  aiModalCloseButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    width: '100%',
    alignItems: 'center',
  },
  aiModalCloseText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.fontSize.base,
  },
});
