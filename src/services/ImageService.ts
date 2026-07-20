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
  const options: any = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8, // Compression
  };
  return await ImagePicker.launchImageLibraryAsync(options);
};

export const takePhotoWithCamera = async () => {
  const options: any = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8, // Compression
  };
  return await ImagePicker.launchCameraAsync(options);
};

export const uploadImageToFirebase = async (uri: string) => {
  if (!uri) return uri;

  // On Web, convert blob/file directly to Base64 data URI to avoid CORS restrictions on Firebase Storage
  if (Platform.OS === 'web' || uri.startsWith('data:image')) {
    if (uri.startsWith('data:image')) return uri;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(uri);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[ImageService] Web base64 conversion fallback:', err.message);
      return uri;
    }
  }

  // Native Mobile Firebase Storage Upload
  try {
    const { storage, isConfigured } = require('../config/firebase');
    const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

    if (isConfigured) {
      const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, `profiles/${filename}`);

      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.warn('[ImageService] Firebase Storage upload error:', error.message);
  }

  return uri;
};
