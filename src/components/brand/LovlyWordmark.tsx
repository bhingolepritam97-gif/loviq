import React, { memo } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface LovlyWordmarkProps {
  size?: any;
  variant?: 'light' | 'dark';
  style?: StyleProp<ImageStyle>;
}

const LovlyWordmark = ({ size = { width: 200, height: 60 }, variant = 'dark', style }: LovlyWordmarkProps) => {
  const width = typeof size === 'number' ? size : (size?.width || 200);
  const height = typeof size === 'number' ? size : (size?.height || 60);
  return (
    <Image 
      source={require('../../../assets/logo.png')} 
      style={[{ width, height, resizeMode: 'contain' }, style]} 
    />
  );
};

export default memo(LovlyWordmark);
