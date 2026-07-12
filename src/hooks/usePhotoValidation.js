import { useState } from 'react';
import { validatePhoto } from '../services/ValidationService';

export default function usePhotoValidation() {
  const [validating, setValidating] = useState(false);

  const performAIQualityCheck = async (uri, existingPhotos) => {
    setValidating(true);
    try {
      const results = await validatePhoto(uri, existingPhotos);
      return results;
    } finally {
      setValidating(false);
    }
  };

  return {
    validating,
    performAIQualityCheck,
  };
}
