import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SuperLikeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.title}>Get Noticed with Super Likes!</Text>
        <Text style={styles.subtitle}>
          Profiles you Super Like are 3x more likely to match with you. Stand out from the crowd!
        </Text>

        {/* Pricing options */}
        <View style={styles.pricingContainer}>
          {[
            { count: '5', price: '$4.99', active: false },
            { count: '25', price: '$14.99', popular: true, active: true },
            { count: '10', price: '$7.99', active: false },
          ].map((opt, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.priceCard, opt.active && styles.priceCardActive]}
              onPress={() => navigation.goBack()}
            >
              {opt.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}
              <Text style={styles.countText}>{opt.count} Super Likes</Text>
              <Text style={styles.priceText}>{opt.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={Gradients.superLike.colors}
            start={Gradients.superLike.start}
            end={Gradients.superLike.end}
            style={styles.gradient}
          >
            <Text style={styles.btnText}>Get Super Likes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, height: 60 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  emoji: { fontSize: 80, marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['3xl'] },
  pricingContainer: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginBottom: Spacing['3xl'] },
  priceCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', position: 'relative' },
  priceCardActive: { borderColor: Colors.superBlue, backgroundColor: Colors.superLikeLight + '40' },
  popularBadge: { position: 'absolute', top: -10, backgroundColor: Colors.superBlue, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  popularText: { color: Colors.white, fontSize: 8, fontWeight: '800' },
  countText: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.xs },
  priceText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  button: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  gradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
