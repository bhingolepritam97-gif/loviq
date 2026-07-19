import React, { useRef } from 'react';
import { Text, View, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { createStyles } from '../styles/datingIntent.styles';
import { Gradients } from '../../../theme';

export default function IntentCard({ id, title, description, emoji, isSelected, onPress }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.01 : 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  // React to change in isSelected state
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.01 : 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  }, [isSelected, scaleAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: '100%' }}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${title}, ${description}`}
    >
      <Animated.View
        style={[
          styles.intentCard,
          isSelected && styles.intentCardSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            {/* Emoji Circle */}
            <View style={[styles.emojiContainer, isSelected && styles.emojiContainerSelected]}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>
 
            {/* Texts */}
            <View style={styles.textContainer}>
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                {title}
              </Text>
              <Text style={styles.cardDesc}>{description}</Text>
            </View>
          </View>
 
          {/* Chevron */}
          <Text style={[styles.chevron, isSelected && styles.chevronSelected]}>
            ❯
          </Text>
        </View>
 
        {/* Selected Gradient Border at bottom */}
        {isSelected && (
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.selectedBorder}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
export { IntentCard };
