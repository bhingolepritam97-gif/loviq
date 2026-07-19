import React, { memo } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface LovlySailMarkProps {
  size?: any;
  variant?: 'light' | 'dark';
  style?: StyleProp<ImageStyle>;
}

const LovlySailMark = ({ size = 60, variant = 'dark', style }: LovlySailMarkProps) => {
  const width = typeof size === 'number' ? size : (size?.width || 60);
  const height = typeof size === 'number' ? size : (size?.height || 60);
  return (
    <Image 
      source={require('../../../assets/icon.png')} 
      style={[{ width, height, resizeMode: 'contain' }, style]} 
    />
  );
};

export default memo(LovlySailMark);
