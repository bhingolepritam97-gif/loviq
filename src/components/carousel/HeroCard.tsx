import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Shadow, Spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface HeroCardProps {
  card: any;
  index: number;
  activeIndex: any;
  itemCount: number;
}

const HeroCard = ({ card, index, activeIndex, itemCount }: HeroCardProps) => {
  const { colors: Colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => {
    if (itemCount <= 1) {
      return { transform: [{ scale: 1 }, { translateX: 0 }, { rotate: '0deg' }] as any, zIndex: 3 };
    }

    let diff = (index - activeIndex.value) % itemCount;
    if (diff < 0) diff += itemCount;
    if (diff > itemCount / 2) diff -= itemCount;

    // diff ranges from -1.5 to 1.5 for 3 items
    // -1: Left, 0: Center, 1: Right
    // -1.5 / 1.5: Hidden behind

    const translateX = interpolate(
      diff,
      [-1.5, -1, 0, 1, 1.5],
      [0, -width * 0.12, 0, width * 0.12, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      diff,
      [-1.5, -1, 0, 1, 1.5],
      [0.8, 0.9, 1, 0.9, 0.8],
      Extrapolation.CLAMP
    );

    const rotateStr = interpolate(
      diff,
      [-1.5, -1, 0, 1, 1.5],
      [0, -8, 0, 8, 0],
      Extrapolation.CLAMP
    );

    const zIndex = Math.abs(diff) < 0.5 ? 3 : Math.abs(diff) < 1.1 ? 2 : 1;

    return {
      transform: [
        { translateX } as any,
        { scale } as any,
        { rotate: `${rotateStr}deg` } as any,
      ],
      zIndex,
    } as any;
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Image 
        source={{ uri: card.photo }} 
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      
      {card.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>✨ New here</Text>
        </View>
      )}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.scrim}>
        <View style={styles.infoRow}>
          <Text style={styles.name} numberOfLines={1}>{card.name}</Text>
          {card.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={styles.title}>{card.title}</Text>
      </LinearGradient>

      {card.hasHeart && (
        <View style={[styles.heartCircle, diffForHeart(index, itemCount) < 0 ? { left: -10 } : { right: -10 }]}>
          <Ionicons name="heart" size={14} color={Colors.primary} />
        </View>
      )}
    </Animated.View>
  );
};

// Helper just for static styling of heart if needed, though animated would be better.
// Actually, let's keep the heart position static based on original array index or random to match design.
const diffForHeart = (index: number, itemCount?: number) => index % 2 === 0 ? 1 : -1;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: width * 0.45,
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Shadow.lg,
    alignSelf: 'center',
    top: 15,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    padding: Spacing.md,
    justifyContent: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  heartCircle: {
    position: 'absolute',
    top: '45%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
});

export default memo(HeroCard);
