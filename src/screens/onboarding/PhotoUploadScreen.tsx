import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
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
import { createUserProfile } from '../../services/UserService';
import { uploadImageToFirebase } from '../../services/ImageService';
import { auth } from '../../config/firebase';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

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
  } catch (error) {
    console.warn('Failed compressing image, returning original:', error.message);
    return uri;
  }
};

export default function PhotoUploadScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState([]);
  const [showBioInput, setShowBioInput] = useState(false);
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setProfile, user } = useAuth();
  const flowStartTime = useRef(route.params?.flowStartTime || Date.now());
  const stepStartTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('photo_upload');
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && photos.length < MAX_PHOTOS) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const isValid = photos.length >= MIN_PHOTOS;

  const finishOnboarding = async (bioValue) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      trackOnboardingStepCompleted('photo_upload', Date.now() - stepStartTime.current);
      trackOnboardingComplete(Date.now() - flowStartTime.current);

      await startGracePeriod();

      let currentUser = auth.currentUser || user;
      if (!currentUser) {
        try {
          const { signInAnonymously } = require('firebase/auth');
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
        } catch (lazyErr) {
          console.warn('[PhotoUploadScreen] Lazy sign-in failed, creating mock session:', lazyErr.message);
          currentUser = {
            uid: `mock_${Math.random().toString(36).substring(7)}`,
            email: 'mockuser@lovly.app'
          };
        }
      }
      
      let offlineFallbackUsed = false;
      const uploadedPhotoUrls = [];
      for (const localUri of photos) {
        try {
          const compressed = await compressImage(localUri);
          const downloadUrl = await uploadImageToFirebase(compressed);
          uploadedPhotoUrls.push(downloadUrl);
        } catch (uploadErr) {
          console.warn('[PhotoUploadScreen] Upload failed, appending local fallback Uri:', uploadErr.message);
          uploadedPhotoUrls.push(localUri);
          offlineFallbackUsed = true;
        }
      }

      let locationData = { latitude: 18.5204, longitude: 73.8567, cityName: 'Pune' };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const reverse = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          locationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            cityName: reverse[0]?.city || reverse[0]?.subregion || 'Pune',
          };
        }
      } catch (locErr) {
        console.warn('Geolocation capture bypassed during onboarding:', locErr.message);
      }

      const newProfile = {
        name: route.params?.name,
        birthdate: route.params?.birthday,
        gender: route.params?.gender,
        genderPreference: route.params?.interestedIn ? [route.params.interestedIn] : ['Everyone'],
        bio: bioValue,
        interests: route.params?.interests || [],
        photos: uploadedPhotoUrls,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        cityName: locationData.cityName,
        distance_range: 25,
        age_range: [18, 35],
        eloScore: 1500,
        isPremium: false,
        isVerified: false,
        profileComplete: true,
        createdAt: new Date().toISOString(),
      };

      await createUserProfile(currentUser.uid, newProfile);
      await AsyncStorage.setItem(`profileComplete_${currentUser.uid}`, 'true');

      setProfile({
        id: currentUser.uid,
        ...newProfile
      });
      // The state change to complete profile will automatically trigger AppNavigator to switch stacks to 'Main'.
    } catch (err) {
      console.error(err);
      const isOfflineMsg = err.message?.includes('Network request failed') || err.message?.includes('network') || err.message?.includes('API Timeout');
      Alert.alert(
        isOfflineMsg ? 'No Internet Connection' : 'Onboarding Error',
        isOfflineMsg 
          ? 'We could not connect to Lovly servers. Please check your internet connection and try again.' 
          : (err.message || 'Failed to complete profile creation. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#130516', '#22082b']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      
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
          >
            <Ionicons name="arrow-back" size={22} color="#FFF0F3" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lovly</Text>
          <TouchableOpacity 
            style={styles.helpBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Help"
          >
            <Ionicons name="help-circle-outline" size={22} color="#FFF0F3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          <Text style={styles.stepIndicator}>Step 4 of 6</Text>
          
          <View style={styles.titleRow}>
            <Text style={styles.titleRegular}>Curate your </Text>
            <Text style={styles.titleItalic}>gallery</Text>
          </View>
          <Text style={styles.subtitle}>
            Share your world. Profiles with at least 4 photos have a 70% higher match rate.
          </Text>

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
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.bioWrapper}>
            {!showBioInput ? (
              <TouchableOpacity 
                style={styles.bioButton} 
                onPress={() => setShowBioInput(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add an editorial bio (optional)"
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

          <View style={styles.tipCard}>
            <Ionicons name="sparkles" size={18} color="#E8628F" style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipDesc}>
                Natural light and candid shots tend to spark more meaningful connections.
              </Text>
            </View>
          </View>
        </View>

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
      </ScrollView>
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
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    justifyContent: 'space-between',
  },
  mainWrapper: {
    flex: 1,
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
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    ...Shadow.sm 
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
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
