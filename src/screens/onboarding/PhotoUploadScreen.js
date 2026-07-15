import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
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
import ProgressBar from '../../components/ProgressBar';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
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

export default function PhotoUploadScreen({ navigation, route }) {
  const [photos, setPhotos] = useState([]);
  const [showBioInput, setShowBioInput] = useState(false);
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setProfile } = useAuth();
  const flowStartTime = useRef(route.params?.flowStartTime || Date.now());
  const stepStartTime = useRef(Date.now());

  useEffect(() => {
    trackOnboardingStep('photo_upload');
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && photos.length < MAX_PHOTOS) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const isValid = photos.length >= MIN_PHOTOS;

  const finishOnboarding = async (bioValue) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      trackOnboardingStepCompleted('photo_upload', Date.now() - stepStartTime.current);
      trackOnboardingComplete(Date.now() - flowStartTime.current);

      // Start the 24h grace period clock — must happen once, right at signup completion.
      await startGracePeriod();

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User session not found. Please log in again.');
      }
      
      // 1. Upload photos to Firebase Storage
      let offlineFallbackUsed = false;
      const uploadedPhotoUrls = [];
      for (const localUri of photos) {
        try {
          const compressedUri = await compressImage(localUri);
          const downloadUrl = await uploadImageToFirebase(compressedUri);
          uploadedPhotoUrls.push(downloadUrl);
        } catch (uploadErr) {
          console.warn('Individual photo upload failed, using local URI fallback:', uploadErr.message);
          uploadedPhotoUrls.push(localUri);
          offlineFallbackUsed = true;
          break; // break early or continue
        }
      }

      // 2. Request and fetch user location
      let locationData = {
        latitude: 37.7749, // Default SF coordinates
        longitude: -122.4194,
        geohash: '9q8yy',
        cityName: 'San Francisco'
      };

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          if (loc && loc.coords) {
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            const hash = geofire.geohashForLocation([lat, lng]);
            
            // Try to do reverse geocoding to get city name
            let cityName = 'Current Location';
            try {
              const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
              if (geocode && geocode[0]) {
                cityName = geocode[0].city || geocode[0].subregion || cityName;
              }
            } catch (geoErr) {
              console.warn('Reverse geocoding city name failed:', geoErr.message);
            }

            locationData = {
              latitude: lat,
              longitude: lng,
              geohash: hash,
              cityName
            };
          }
        }
      } catch (locErr) {
        console.warn('Onboarding Location permission warning:', locErr.message);
      }

      // 3. Save profile metadata
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
        // Match discovery defaults
        distance_range: 25,
        age_range: [18, 35],
        eloScore: 1500,
        isPremium: false,
        isVerified: false,
        profileComplete: true,
        createdAt: new Date().toISOString(),
      };

      await createUserProfile(currentUser.uid, newProfile);
      
      // Save local backup for auth offline checking
      await AsyncStorage.setItem(`profileComplete_${currentUser.uid}`, 'true');

      // 5. Update context profile state so DiscoverScreen wakes up
      setProfile({
        id: currentUser.uid,
        ...newProfile
      });

      // Navigate to Main using a short deferral to prevent unmount race conditions
      const navigateToMain = () => {
        setTimeout(() => {
          try {
            navigation.navigate('Main', { justOnboarded: true, profileData: { ...newProfile, id: currentUser.uid } });
          } catch (e) {
            console.warn('[Onboarding] Deferred navigation to Main ignored:', e.message);
          }
        }, 200);
      };

      navigateToMain();
    } catch (err) {
      console.error(err);
      Alert.alert('Onboarding Error', err.message || 'Failed to complete profile creation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar progress={4} totalSteps={4} />
      <Text style={styles.title}>Add your photos</Text>
      <Text style={styles.subtitle}>Add at least {MIN_PHOTOS} - profiles with more photos get way more matches.</Text>

      <View style={styles.grid}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
          <TouchableOpacity key={i} style={styles.slot} onPress={pickImage}>
            {photos[i] ? (
              <Image source={{ uri: photos[i] }} style={styles.photo} />
            ) : (
              <Text style={styles.plus}>+</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {!showBioInput ? (
        <TouchableOpacity onPress={() => setShowBioInput(true)}>
          <Text style={styles.bioLink}>+ Add a bio (optional)</Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          style={styles.bioInput}
          placeholder="Tell people a bit about yourself..."
          value={bio}
          onChangeText={setBio}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={300}
          selectionColor={Colors.primary}
        />
      )}

      <TouchableOpacity
        style={[styles.continueButton, (!isValid || submitting) && styles.continueButtonDisabled]}
        disabled={!isValid || submitting}
        onPress={() => finishOnboarding(bio)}
        activeOpacity={isValid && !submitting ? 0.85 : 1}
      >
        <LinearGradient
          colors={isValid && !submitting ? Gradients.primary.colors : [Colors.border, Colors.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueGradient}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>Start swiping</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, paddingTop: 60, backgroundColor: Colors.background },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 4, marginTop: 16 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  slot: {
    width: '30%', aspectRatio: 0.8, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  plus: { fontSize: 28, color: Colors.textMuted },
  bioLink: { color: Colors.primary, fontSize: 14, marginBottom: 16, fontWeight: '700' },
  bioInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 14,
    minHeight: 80, fontSize: 14, marginBottom: 16, textAlignVertical: 'top', backgroundColor: Colors.surface,
    color: Colors.text,
  },
  continueButton: {
    borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.md, marginTop: 'auto',
  },
  continueButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  continueGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
