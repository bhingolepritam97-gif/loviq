export const swapPhotos = (photos, idx1, idx2) => {
  const newPhotos = [...photos];
  const temp = newPhotos[idx1];
  newPhotos[idx1] = newPhotos[idx2];
  newPhotos[idx2] = temp;
  return newPhotos;
};
