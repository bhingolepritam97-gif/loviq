import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveContainer } from '../../core/responsive';

export default function RewindScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();

  return (
    <ResponsiveContainer>
      <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Close screen" onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔄</Text>
        <Text style={styles.title}>Oops! Undo Your Last Swipe</Text>
        <Text style={styles.subtitle}>
          Did you swipe left by mistake? Rewind is a Lovly Gold premium feature. Get gold to bring them back!
        </Text>

        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to Lovly Gold"
          style={styles.button}
          onPress={() => navigation.navigate('Premium')}
        >
          <LinearGradient
            colors={Gradients.gold.colors}
            start={Gradients.gold.start}
            end={Gradients.gold.end}
            style={styles.gradient}
          >
            <Text style={styles.btnText}>Upgrade to Lovly Gold</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
    </ResponsiveContainer>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, height: 60 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  emoji: { fontSize: 80, marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['3xl'] },
  button: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  gradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
