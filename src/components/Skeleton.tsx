import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: any;
  height?: any;
  borderRadius?: any;
  style?: any;
  containerStyle?: any;
}

export const Skeleton = ({ width, height, borderRadius, style, containerStyle }: SkeletonProps) => {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1, // -1 means infinite repeat
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width,
            height,
            borderRadius: borderRadius !== undefined ? borderRadius : Radius.sm,
          },
          style,
          animatedStyle,
        ]}
      />
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.2)', // Matches existing skeleton color in dark mode
  },
});
