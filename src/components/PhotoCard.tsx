import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import DeleteButton from './DeleteButton';
import AddPhotoCard from './AddPhotoCard';
import QualityBadge from './QualityBadge';
import UploadOverlay from './UploadOverlay';
import { Shadow, Radius, Gradients, Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface PhotoCardProps {
  photo?: any;
  index?: number;
  isFirst?: boolean;
  isReorderMode?: any;
  isSelectedForSwap?: boolean;
  onPress?: () => any;
  onRemove?: () => any;
  cardWidth?: any;
  cardHeight?: any;
}

export default React.memo(function PhotoCard({
  photo,
  index,
  isFirst,
  isReorderMode,
  isSelectedForSwap,
  onPress,
  onRemove,
  cardWidth,
  cardHeight,
}: PhotoCardProps) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const scale = useSharedValue(1);
  const wiggleRotation = useSharedValue(0);

  useEffect(() => {
    if (isReorderMode && photo) {
      wiggleRotation.value = withRepeat(
        withSequence(
          withTiming(-1.2, { duration: 110 }),
          withTiming(1.2, { duration: 110 })
        ),
        -1,
        true
      );
    } else {
      wiggleRotation.value = withTiming(0, { duration: 150 });
    }
  }, [isReorderMode, photo]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value } as any,
        { rotate: `${wiggleRotation.value}deg` } as any,
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { width: cardWidth, height: cardHeight },
        isSelectedForSwap && styles.cardContainerSelected,
        animatedStyle,
      ]}
    >
      {photo ? (
        <View style={styles.cardImageWrapper}>
          {/* Main Card Touch Target */}
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={`Photo ${index + 1}. AI check ${photo.aiResults?.passed ? 'Passed' : 'Needs attention'}.`}
          >
            <Image source={{ uri: photo.uri }} style={styles.cardImage} resizeMode="cover" />
          </TouchableOpacity>
          
          {/* Loader / Upload Progress state */}
          {photo.uploading && (
            <UploadOverlay progress={photo.progress} />
          )}

          {/* AI Warning / Check Badge */}
          {!photo.uploading && photo.aiResults && (
            <QualityBadge passed={photo.aiResults.passed} />
          )}

          {/* Sibling positioned Delete trigger */}
          <DeleteButton onPress={onRemove} />

          {/* Photo Order Indicators / Badges */}
          {isFirst ? (
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={[styles.mainBadge, { pointerEvents: 'none' }]}
            >
              <Text style={styles.mainBadgeText}>⭐ Main Photo</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.orderBadge, { pointerEvents: 'none' }]}>
              <Text style={styles.orderBadgeText}>Photo #{index + 1}</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={styles.cardTouchArea}
          accessibilityRole="button"
          accessibilityLabel={`Empty photo slot ${index + 1}. Tap to upload.`}
        >
          <AddPhotoCard isRequired={index < 2} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

const createStyles = (Colors) => StyleSheet.create({
  cardContainer: {
    borderRadius: Radius.xl, // 20px
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  cardContainerSelected: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 16px rgba(232, 98, 143, 0.3)',
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  cardTouchArea: {
    flex: 1,
  },
  cardImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    zIndex: 5,
  },
  mainBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  orderBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    zIndex: 5,
  },
  orderBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
