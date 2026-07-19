import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { AppState } from 'react-native';

interface AutoCarouselOptions {
  itemCount: number;
  autoplay?: boolean;
  interval?: number;
  animationDuration?: number;
  loop?: boolean;
}

export function useAutoCarousel({
  itemCount,
  autoplay = true,
  interval = 5000,
  animationDuration = 700,
}: AutoCarouselOptions) {
  const activeIndex = useSharedValue(0);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);

  const goToNext = useCallback(() => {
    if (itemCount <= 1) return;
    
    // We constantly increment to allow infinite continuous rotation
    // The visual logic handles modulo math so it loops correctly.
    let nextVal = activeIndex.value + 1;
    
    activeIndex.value = withTiming(nextVal, {
      duration: animationDuration,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });
  }, [activeIndex, itemCount, animationDuration]);

  const startAutoPlay = useCallback(() => {
    if (!autoplay || itemCount <= 1) return;
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        goToNext();
      }
    }, interval);
  }, [autoplay, itemCount, interval, goToNext]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    stopAutoPlay();
  }, [stopAutoPlay]);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    startAutoPlay();
  }, [startAutoPlay]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        stopAutoPlay();
      } else if (nextAppState === 'active') {
        if (!isPausedRef.current) startAutoPlay();
      }
    });

    startAutoPlay();

    return () => {
      subscription.remove();
      stopAutoPlay();
    };
  }, [startAutoPlay, stopAutoPlay]);

  return {
    activeIndex,
    pause,
    resume,
  };
}
