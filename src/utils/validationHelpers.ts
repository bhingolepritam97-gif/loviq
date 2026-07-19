export const getQualityScore = (aiResults) => {
  if (!aiResults) return 0;
  let score = 50; // base score
  if (aiResults.faceDetected) score += 20;
  if (aiResults.blurScore === 'Excellent') score += 15;
  if (aiResults.lightingScore === 'Excellent') score += 10;
  if (aiResults.smileDetected) score += 5;
  return score;
};

export const checkLowResolution = (uri) => {
  // Returns a mock resolution check
  return false;
};
