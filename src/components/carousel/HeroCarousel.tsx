import React, { useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Animated, { useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { useAutoCarousel } from './useAutoCarousel';
import HeroCard from './HeroCard';
import { useTheme } from '../../context/ThemeContext';

export default function HeroCarousel({ 
  cards = [], 
  autoplay = true, 
  interval = 5000, 
  animationDuration = 700,
  pauseOnTouch = true 
}) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const itemCount = cards.length;
  
  const { activeIndex, pause, resume } = useAutoCarousel({
    itemCount,
    autoplay,
    interval,
    animationDuration,
    loop: true,
  });

  const resumeTimeoutRef = useRef(null);

  // Gesture handling to pause on touch
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (pauseOnTouch) {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        pause();
      }
    },
    onPanResponderRelease: () => {
      if (pauseOnTouch) {
        // Resume after 5 seconds of inactivity
        resumeTimeoutRef.current = setTimeout(() => {
          resume();
        }, 5000);
      }
    },
    onPanResponderTerminate: () => {
      if (pauseOnTouch) {
        resumeTimeoutRef.current = setTimeout(() => {
          resume();
        }, 5000);
      }
    }
  }), [pause, resume, pauseOnTouch]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  if (itemCount === 0) {
    return <View style={styles.emptyContainer} />;
  }

  return (
    <View style={styles.wrapper} {...panResponder.panHandlers}>
      <View style={styles.container}>
        {cards.map((card, index) => (
          <HeroCard 
            key={card.id || index}
            card={card}
            index={index}
            activeIndex={activeIndex}
            itemCount={itemCount}
          />
        ))}
      </View>
      <View style={styles.pagination}>
        {cards.map((_, index) => (
          <PaginationDot key={index} index={index} activeIndex={activeIndex} itemCount={itemCount} styles={styles} Colors={Colors} />
        ))}
      </View>
    </View>
  );
}

const PaginationDot = ({ index, activeIndex, itemCount, styles, Colors }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Determine the actual current visual index (0, 1, 2)
    const currentModuloIndex = Math.round(activeIndex.value) % itemCount;
    const isActive = currentModuloIndex === index;
    
    return {
      width: isActive ? 14 : 6,
      backgroundColor: isActive ? Colors.primary : (Colors.border || '#E0E0E0')
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const createStyles = (Colors) => StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  container: {
    height: 240, // Enough height to accommodate cards and scale
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 260,
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  pagination: { 
    flexDirection: 'row', 
    alignSelf: 'center', 
    gap: 6, 
    marginTop: 15,
    height: 10,
    alignItems: 'center',
  },
  dot: { 
    height: 6, 
    borderRadius: 3,
  },
});
