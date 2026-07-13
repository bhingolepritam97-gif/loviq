import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const requestCameraAndGalleryPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    return libraryStatus === 'granted' && cameraStatus === 'granted';
  }
  return true;
};

export const pickImageFromLibrary = async () => {
  const options = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8, // Compression
  };
  return await ImagePicker.launchImageLibraryAsync(options);
};

export const takePhotoWithCamera = async () => {
  const options = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8, // Compression
  };
  return await ImagePicker.launchCameraAsync(options);
};

export const uploadImageToFirebase = async (uri) => {
  const { storage, isConfigured } = require('../config/firebase');
  const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

  if (!isConfigured) {
    console.warn("Firebase not configured. Returning local URI as fallback.");
    return uri;
  }

  try {
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, `profiles/${filename}`);

    const response = await fetch(uri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.warn("Error uploading image to Firebase Storage:", error.message);
    throw error;
  }
};
