/**
 * AnimatedLogo — Premium Lovly logo with motion.
 *
 * Animations:
 *   'scale'  — spring-in reveal (splash screen entry)
 *   'pulse'  — gentle breathing pulse (loading states)
 *   'float'  — subtle vertical drift (welcome screen hero)
 *   'fade'   — simple opacity fade-in
 *
 * Props:
 *   type     — 'logo' (full wordmark) | 'icon' (sail mark only)
 *   animation — 'scale' | 'pulse' | 'float' | 'fade'
 *   size     — see LogoSize / IconSize
 *   variant  — 'dark' | 'light'
 *   duration — override default duration (ms)
 *   style
 */
import React, { useEffect, useRef, memo } from 'react';
import { Animated, Easing } from 'react-native';
import BrandLogo from './BrandLogo';
import BrandIcon from './BrandIcon';

interface AnimatedLogoProps {
  type?: 'logo' | 'icon';
  animation?: 'scale' | 'pulse' | 'float' | 'fade';
  size?: any;
  variant?: 'dark' | 'light';
  duration?: number;
  style?: any;
}

const AnimatedLogo = ({
  type = 'logo',
  animation = 'pulse',
  size = 'md',
  variant = 'dark',
  duration,
  style,
}: AnimatedLogoProps) => {
  const animValue = useRef(new Animated.Value(animation === 'scale' ? 0 : 1)).current;
  const opacityValue = useRef(new Animated.Value(animation === 'fade' || animation === 'scale' ? 0 : 1)).current;

  useEffect(() => {
    let anim;

    if (animation === 'scale') {
      anim = Animated.parallel([
        Animated.spring(animValue, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: duration || 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    } else if (animation === 'pulse') {
      animValue.setValue(1);
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.06,
            duration: (duration || 1800) / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: (duration || 1800) / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (animation === 'float') {
      animValue.setValue(0);
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration || 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration || 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (animation === 'fade') {
      anim = Animated.timing(opacityValue, {
        toValue: 1,
        duration: duration || 600,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      });
    }

    if (anim) anim.start();
    return () => { if (anim) anim.stop(); };
  }, [animation, animValue, opacityValue, duration]);

  const getTransform = () => {
    switch (animation) {
      case 'scale':
        return {
          transform: [{ scale: animValue }],
          opacity: opacityValue,
        };
      case 'pulse':
        return { transform: [{ scale: animValue }] };
      case 'float':
        return {
          transform: [{
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -8],
            }),
          }],
        };
      case 'fade':
        return { opacity: opacityValue };
      default:
        return {};
    }
  };

  const LogoComponent = type === 'logo' ? BrandLogo : BrandIcon;

  return (
    <Animated.View style={[getTransform(), style]}>
      <LogoComponent size={size} variant={variant} />
    </Animated.View>
  );
};

export default memo(AnimatedLogo);
