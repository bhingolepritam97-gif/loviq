import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Radius, Gradients } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoints } from '../core/responsive';

/**
 * Avatar — circular profile image
 * @param {string} uri — image URI
 * @param {string} name — fallback initials
 * @param {number} size — diameter in px
 * @param {boolean} showOnline — show green online dot
 * @param {boolean} showBorder — show gradient border
 */
interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
  showBorder?: boolean;
  style?: any;
}

export default function Avatar({ uri, name, size, showOnline = false, showBorder = false, style }: AvatarProps) {
  const { colors: Colors } = useTheme();
  const { isPhone } = useBreakpoints();
  const defaultSize = isPhone ? 48 : 64;
  const resolvedSize = size ?? defaultSize;
  const styles = createStyles(Colors);
  const initials = name ? name.slice(0, 1).toUpperCase() : '?';
  const borderWidth = showBorder ? 2 : 0;
  const innerSize = resolvedSize - borderWidth * 2 - 4;

  if (showBorder) {
    return (
      <View style={[{ width: resolvedSize, height: resolvedSize }, style]}>
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={[styles.gradientBorder, { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 }]}
        >
          <View style={[styles.innerBorder, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
            {uri ? (
              <Image source={{ uri }} style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }} />
            ) : (
              <View style={[styles.fallback, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
                <Text style={[styles.initials, { fontSize: innerSize * 0.38 }]}>{initials}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
        {showOnline && <View style={[styles.onlineDot, { width: resolvedSize * 0.27, height: resolvedSize * 0.27, borderRadius: resolvedSize * 0.135, right: 0, bottom: 0 }]} />}
      </View>
    );
  }

  return (
    <View style={[{ width: resolvedSize, height: resolvedSize }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 }} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={[styles.fallback, { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 }]}
        >
          <Text style={[styles.initials, { fontSize: resolvedSize * 0.38 }]}>{initials}</Text>
        </LinearGradient>
      )}
      {showOnline && (
        <View style={[styles.onlineDot, { width: resolvedSize * 0.27, height: resolvedSize * 0.27, borderRadius: resolvedSize * 0.135, right: 0, bottom: 0 }]} />
      )}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  gradientBorder: { justifyContent: 'center', alignItems: 'center' },
  innerBorder: {
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallback: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  initials: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
