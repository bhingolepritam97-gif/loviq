import { getQualityScore } from '../utils/validationHelpers';

export const validatePhoto = async (uri, existingPhotos) => {
  // Simulate network/local processing latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isDuplicate = existingPhotos.some(p => p.uri === uri);
  const faceDetected = Math.random() > 0.08; // 92% pass rate
  const blurScore = Math.random() > 0.12 ? 'Excellent' : 'Blurry';
  const lightingScore = Math.random() > 0.1 ? 'Good Lighting' : 'Too Dark';
  const smileDetected = Math.random() > 0.35; // 65% smile
  
  const passed = faceDetected && blurScore !== 'Blurry' && lightingScore !== 'Too Dark' && !isDuplicate;
  const score = getQualityScore({ faceDetected, blurScore, lightingScore, smileDetected });

  return {
    faceDetected,
    blurScore,
    lightingScore,
    smileDetected,
    isDuplicate,
    passed,
    score,
  };
};
