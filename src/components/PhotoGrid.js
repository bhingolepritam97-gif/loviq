import React from 'react';
import { View, StyleSheet } from 'react-native';
import PhotoCard from './PhotoCard';
import { Spacing } from '../theme';

export default function PhotoGrid({
  photos,
  isReorderMode,
  selectedSwapIndex,
  onCardPress,
  onRemovePhoto,
  cardWidth,
  cardHeight,
  maxPhotos = 6,
}) {
  return (
    <View style={styles.photoGrid}>
      {Array.from({ length: maxPhotos }).map((_, idx) => {
        const photo = photos[idx];
        const isFirst = idx === 0;
        const isSelectedForSwap = selectedSwapIndex === idx;

        return (
          <PhotoCard
            key={idx}
            photo={photo}
            index={idx}
            isFirst={isFirst}
            isReorderMode={isReorderMode}
            isSelectedForSwap={isSelectedForSwap}
            onPress={() => onCardPress(idx)}
            onRemove={() => onRemovePhoto(idx)}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
});
