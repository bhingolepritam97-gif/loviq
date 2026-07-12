import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Gradients } from '../theme';

/**
 * Avatar — circular profile image
 * @param {string} uri — image URI
 * @param {string} name — fallback initials
 * @param {number} size — diameter in px
 * @param {boolean} showOnline — show green online dot
 * @param {boolean} showBorder — show gradient border
 */
export default function Avatar({ uri, name, size = 48, showOnline = false, showBorder = false, style }) {
  const initials = name ? name.slice(0, 1).toUpperCase() : '?';
  const borderWidth = showBorder ? 2 : 0;
  const innerSize = size - borderWidth * 2 - 4;

  if (showBorder) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={[styles.gradientBorder, { width: size, height: size, borderRadius: size / 2 }]}
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
        {showOnline && <View style={[styles.onlineDot, { width: size * 0.27, height: size * 0.27, borderRadius: size * 0.135, right: 0, bottom: 0 }]} />}
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={Gradients.primary.colors}
          start={Gradients.primary.start}
          end={Gradients.primary.end}
          style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </LinearGradient>
      )}
      {showOnline && (
        <View style={[styles.onlineDot, { width: size * 0.27, height: size * 0.27, borderRadius: size * 0.135, right: 0, bottom: 0 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
