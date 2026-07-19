import { Image } from 'react-native';
import { getQualityScore } from '../utils/validationHelpers';

const getImageSize = (uri): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 })
    );
  });
};

export const validatePhoto = async (uri, existingPhotos) => {
  // 1. Minimum Resolution Check
  const { width, height } = await getImageSize(uri);
  const lowResolution = width < 480 || height < 480;

  // Simulate network/local processing latency
  await new Promise(resolve => setTimeout(resolve, 1000));

  const isDuplicate = existingPhotos.some(p => p.uri === uri);
  
  // Face detection pass rate (90%)
  const faceDetected = Math.random() > 0.10;
  
  // Blur score check: automatically fail or flag if resolution is too low, else 88% pass
  const blurScore = lowResolution
    ? 'Blurry'
    : Math.random() > 0.12 ? 'Excellent' : 'Blurry';
    
  const lightingScore = Math.random() > 0.1 ? 'Good Lighting' : 'Too Dark';
  const smileDetected = Math.random() > 0.35;
  
  const passed = faceDetected && blurScore !== 'Blurry' && lightingScore !== 'Too Dark' && !isDuplicate && !lowResolution;
  const score = getQualityScore({ faceDetected, blurScore, lightingScore, smileDetected });

  // Generate warning messages if any quality checks fail
  const warnings = [];
  if (!faceDetected) {
    warnings.push("We couldn't detect a clear face in this photo. Clear face photos get 3x more matches.");
  }
  if (blurScore === 'Blurry') {
    warnings.push("This photo looks a bit blurry. For a better main photo, try uploading a high-res shot.");
  }
  if (lowResolution) {
    warnings.push(`Resolution is a bit low (${width}x${height}px). Try picking an image with at least 480x480px.`);
  }

  return {
    faceDetected,
    blurScore,
    lightingScore,
    smileDetected,
    isDuplicate,
    lowResolution,
    resolution: `${width}x${height}`,
    passed,
    score,
    warnings,
  };
};

