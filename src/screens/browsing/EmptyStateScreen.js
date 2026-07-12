import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmptyStateScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>No more profiles nearby</Text>
        <Text style={styles.subtitle}>
          Try expanding your distance limit or adjusting age range in settings to find more people.
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Filters')}
        >
          <LinearGradient
            colors={Gradients.primary.colors}
            start={Gradients.primary.start}
            end={Gradients.primary.end}
            style={styles.gradient}
          >
            <Text style={styles.btnText}>Adjust Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  emoji: { fontSize: 80, marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['3xl'] },
  button: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  gradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
