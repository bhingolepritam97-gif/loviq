import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import * as Location from 'expo-location';
import * as geofire from 'geofire-common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { trackOnboardingStep, trackOnboardingStepCompleted, trackOnboardingComplete } from '../../utils/onboardingAnalytics';
import { startGracePeriod } from '../../utils/gracePeriod';
import { useAuth } from '../../context/AuthContext';
import { createUserProfile, syncUserDocumentOnComplete } from '../../services/UserService';
import { uploadImageToFirebase } from '../../services/ImageService';
import { auth } from '../../config/firebase';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 6;

const compressImage = async (uri) => {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (err) {
    console.warn('Image compression failed:', err);
    return uri;
  }
};

export default function PhotoUploadScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user, setProfile, setUser } = useAuth();
  
  const [photos, setPhotos] = useState([]);
  const [bio, setBio] = useState('');
  const [showBioInput, setShowBioInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const { isPhone } = useBreakpoints();

  useEffect(() => {
    trackOnboardingStep('photo_upload');
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setPhotos((prev) => [...prev, compressedUri]);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const finishOnboarding = async (finalBio) => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('More Photos Required', `Please upload at least ${MIN_PHOTOS} photos to continue.`);
      return;
    }

    setSubmitting(true);
    try {
      await startGracePeriod();

      let currentUser = auth?.currentUser || user;
      if (!currentUser) {
        console.log('[PhotoUploadScreen] auth.currentUser is null, waiting up to 5s...');
        await new Promise<void>((resolve) => {
          let waited = 0;
          const interval = setInterval(() => {
            waited += 200;
            if (auth?.currentUser) {
              clearInterval(interval);
              resolve();
            } else if (waited >= 5000) {
              clearInterval(interval);
              resolve(); 
            }
          }, 200);
        });
        currentUser = auth?.currentUser;
      }

      if (!currentUser) {
        const fallbackUid = route?.params?.uid || route?.params?.ruid;
        if (fallbackUid) {
          currentUser = { uid: fallbackUid, email: route?.params?.email || 'user@lovly.app' };
          console.warn('[PhotoUploadScreen] Using route.params uid as fallback:', fallbackUid);
        } else {
          throw new Error('Cannot save profile: user is not authenticated. Please go back and sign in again.');
        }
      }

      console.log('[PhotoUploadScreen] Saving profile for uid:', currentUser.uid);

      let offlineFallbackUsed = false;
      const uploadedPhotoUrls = [];
      for (const localUri of photos) {
        try {
          const remoteUrl = await uploadImageToFirebase(localUri);
          uploadedPhotoUrls.push({ url: remoteUrl, label: 'Onboarding' });
        } catch (uploadErr) {
          console.warn('[PhotoUploadScreen] Firebase storage failed, using local URI fallback for sandbox:', uploadErr);
          uploadedPhotoUrls.push({ url: localUri, label: 'Sandbox Local' });
          offlineFallbackUsed = true;
        }
      }

      let lat = 18.5204;
      let lng = 73.8567;
      let cityName = 'Pune';

      try {
        const locPermission = await Location.getForegroundPermissionsAsync();
        if (locPermission.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (reverseGeocode && reverseGeocode.length > 0) {
            cityName = reverseGeocode[0].city || reverseGeocode[0].district || reverseGeocode[0].region || 'Pune';
          }
        }
      } catch (locErr) {
        console.warn('[PhotoUploadScreen] Could not fetch location coordinates, using default (Pune):', locErr.message);
      }

      const hash = geofire.geohashForLocation([lat, lng]);

      const profilePayload = {
        id: currentUser.uid,
        name: route.params?.name || 'Lovly User',
        email: currentUser.email || route.params?.email || 'user@lovly.app',
        birthday: route.params?.birthday || '1998-01-01',
        gender: route.params?.gender || 'Non-binary',
        interestedIn: route.params?.interestedIn || 'Everyone',
        intent: route.params?.intent || 'not_sure',
        interests: route.params?.interests || [],
        photos: uploadedPhotoUrls,
        bio: finalBio.trim(),
        latitude: lat,
        longitude: lng,
        geohash: hash,
        cityName,
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
      };

      const updatedProfile = await createUserProfile(currentUser.uid, profilePayload);
      
      try {
        await syncUserDocumentOnComplete(currentUser.uid, profilePayload);
      } catch (syncErr) {
        console.warn('[PhotoUploadScreen] Sync trigger failed, profile was still saved:', syncErr.message);
      }

      setProfile(updatedProfile);
      if (!user) {
        setUser(currentUser);
      }

      trackOnboardingStepCompleted('photo_upload', Date.now() - startTime.current);
      trackOnboardingComplete(currentUser.uid);
      
      console.log('[PhotoUploadScreen] Onboarding successfully finished!');
    } catch (err) {
      console.error('[PhotoUploadScreen] Finish error:', err);
      Alert.alert('Save Failed', err.message || 'Could not create profile. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = photos.length >= MIN_PHOTOS;

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#130516', '#22082b']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      
      <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
        {/* Header */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lovly</Text>
            <TouchableOpacity style={styles.helpBtn} accessible={true} accessibilityRole="button" accessibilityLabel="Help info">
              <Ionicons name="help-circle-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inner Form with Desktop support */}
        <View style={styles.innerForm}>
          <Text style={styles.stepIndicator}>STEP 4 OF 4</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleRegular}>Curate your </Text>
            <Text style={styles.titleItalic}>gallery</Text>
          </View>
          <Text style={styles.subtitle}>
            Share your world. Profiles with at least 4 photos have a 70% higher match rate.
          </Text>

          {/* Grid */}
          <View style={styles.grid}>
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
              const hasPhoto = !!photos[i];
              return (
                <View key={i} style={styles.slotContainer}>
                  <TouchableOpacity 
                    style={[styles.slot, hasPhoto && styles.slotFilled]} 
                    onPress={hasPhoto ? undefined : pickImage}
                    activeOpacity={hasPhoto ? 1 : 0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={hasPhoto ? `Uploaded photo ${i + 1}` : `Empty photo slot ${i + 1}`}
                    accessibilityHint={hasPhoto ? "Double tap the close button in the top right to delete." : "Double tap to pick an image from your library."}
                  >
                    {hasPhoto ? (
                      <Image source={{ uri: photos[i] }} style={styles.photo} />
                    ) : (
                      <View style={styles.emptySlotContent}>
                        {i === 0 ? (
                          <Ionicons name="camera-outline" size={24} color="#7A667A" />
                        ) : (
                          <Text style={styles.plus}>+</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>

                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Ionicons name="star" size={10} color="#FFFFFF" />
                    </View>
                  )}

                  {hasPhoto && (
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => removePhoto(i)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${i + 1}`}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Bio input */}
          <View style={styles.bioWrapper}>
            {!showBioInput ? (
              <TouchableOpacity 
                style={styles.bioButton} 
                onPress={() => setShowBioInput(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add an editorial bio (optional)"
                activeOpacity={0.75}
              >
                <Ionicons name="document-text-outline" size={18} color="#E8628F" style={styles.bioIcon} />
                <Text style={styles.bioButtonText}>Add an editorial bio (optional)</Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.bioInput}
                placeholder="Tell people a bit about yourself..."
                value={bio}
                onChangeText={setBio}
                placeholderTextColor="#7A667A"
                multiline
                maxLength={300}
                selectionColor="#E8628F"
                accessible={true}
                accessibilityLabel="Bio input field"
              />
            )}
          </View>

          {/* Pro tip card */}
          <View style={styles.tipCard}>
            <Ionicons name="sparkles" size={18} color="#E8628F" style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipDesc}>
                Natural light and candid shots tend to spark more meaningful connections.
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, (!isValid || submitting) && styles.continueButtonDisabled]}
              disabled={!isValid || submitting}
              onPress={() => finishOnboarding(bio)}
              activeOpacity={isValid && !submitting ? 0.85 : 1}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Start swiping, finish onboarding"
              accessibilityState={{ disabled: !isValid }}
            >
              <LinearGradient
                colors={isValid && !submitting ? ['#E8628F', '#C53D6B'] : ['#3A1E4A', '#3A1E4A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>START SWIPING  &gt;</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.legalText}>
              By continuing you agree to our Terms of Service
            </Text>
          </View>
        </View>
      </ResponsiveScreen>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#130516' 
  },
  headerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 10,
    maxWidth: 480,
    alignSelf: 'center',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8628F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  headerTitle: {
    fontSize: 22,
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    fontWeight: '700',
  },
  helpBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerForm: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A667A',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  titleRegular: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
  },
  titleItalic: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E8628F',
    fontFamily: Typography.fontFamily.serif,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    color: '#A592A5',
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: Spacing.xl 
  },
  slotContainer: { 
    width: '31%', 
    aspectRatio: 0.75, 
    position: 'relative', 
    marginBottom: Spacing.xs 
  },
  slot: {
    width: '100%', 
    height: '100%', 
    borderRadius: Radius.lg, 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    borderStyle: 'dashed', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({ web: { cursor: 'default' } as any, default: {} })
  },
  photo: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'cover',
  },
  emptySlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8628F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  removeBtn: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    backgroundColor: '#FF4757', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10, 
    ...Shadow.sm,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  plus: { 
    fontSize: 24, 
    color: '#7A667A',
    fontWeight: '300',
  },
  bioWrapper: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(232, 98, 143, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.base,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  bioIcon: {
    marginRight: Spacing.sm,
  },
  bioButtonText: {
    color: '#E8628F',
    fontSize: 14,
    fontWeight: '700',
  },
  bioInput: {
    width: '100%',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: Radius.lg, 
    padding: Spacing.base,
    minHeight: 80, 
    fontSize: 14, 
    textAlignVertical: 'top', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFF0F3',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  tipIcon: {
    marginRight: Spacing.base,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFF0F3',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  tipDesc: {
    color: '#A592A5',
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  continueButton: {
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.md,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    ...Platform.select({ web: { cursor: 'default' } as any, default: {} })
  },
  continueGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  legalText: {
    fontSize: 11,
    color: '#7A667A',
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
});
