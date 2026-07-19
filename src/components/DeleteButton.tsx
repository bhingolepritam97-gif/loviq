import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Shadow, Radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function DeleteButton({ onPress }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.removeBtnTouch}
      accessibilityLabel="Remove this photo"
      accessibilityRole="button"
    >
      <View style={styles.removeBtnCircle}>
        <Text style={styles.removeBtnText}>✕</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  removeBtnTouch: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 44, // Hit target complies with 44x44 min area
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeBtnCircle: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF', // High contrast white background
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.primary, // High contrast brand accent border
  },
  removeBtnText: {
    color: Colors.primary, // High contrast brand accent text
    fontSize: 10,
    fontWeight: '900',
  },
});
