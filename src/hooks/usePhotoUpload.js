import { useState, useCallback } from 'react';
import { swapPhotos } from '../utils/photoHelpers';
import { validatePhoto } from '../services/ValidationService';

export default function usePhotoUpload(initialPhotos = [], maxPhotos = 6) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeSlot, setActiveSlot] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedSwapIndex, setSelectedSwapIndex] = useState(null);

  const startUpload = useCallback((uri, activeIndex) => {
    const photoId = `photo-${Date.now()}`;
    const newPhoto = {
      id: photoId,
      uri: uri,
      uploading: true,
      progress: 0.1,
      error: false,
      aiResults: null,
    };

    setPhotos(prev => {
      const updated = [...prev];
      if (activeIndex !== null && activeIndex < prev.length) {
        updated[activeIndex] = newPhoto;
      } else {
        updated.push(newPhoto);
      }
      return updated;
    });

    const runUpload = async () => {
      try {
        const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');
        const manipResult = await manipulateAsync(
          uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        const compressedUri = manipResult.uri;

        const { uploadImageToFirebase } = require('../services/ImageService');
        
        // 15 second timeout for Firebase upload
        const uploadPromise = uploadImageToFirebase(compressedUri);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase upload timed out')), 15000)
        );
        
        const uploadUrl = await Promise.race([uploadPromise, timeoutPromise]);

        const aiResults = await validatePhoto(compressedUri, photos.filter(p => p.id !== photoId));

        setPhotos(prev => prev.map(p => p.id === photoId ? {
          ...p,
          uri: uploadUrl,
          uploading: false,
          progress: 1.0,
          aiResults,
        } : p));
      } catch (err) {
        console.error("Firebase upload failed, falling back:", err);
        setPhotos(prev => prev.map(p => p.id === photoId ? {
          ...p,
          uploading: false,
          error: true,
        } : p));
      }
    };

    runUpload();
  }, [photos]);

  const removePhoto = useCallback((idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const triggerSwap = useCallback((idx1, idx2) => {
    setPhotos(prev => swapPhotos(prev, idx1, idx2));
    setSelectedSwapIndex(null);
  }, []);

  return {
    photos,
    setPhotos,
    activeSlot,
    setActiveSlot,
    isReorderMode,
    setIsReorderMode,
    selectedSwapIndex,
    setSelectedSwapIndex,
    startUpload,
    removePhoto,
    triggerSwap,
  };
}
