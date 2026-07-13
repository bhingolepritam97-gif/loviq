import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { PREMIUM_FEATURES } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { upgradeToPremium } from '../../services/UserService';

const MOCK_PACKAGES = [
  { id: '1_mo', title: '1 Month', priceString: '$14.99', description: '$14.99/mo', isPopular: false },
  { id: '6_mo', title: '6 Months', priceString: '$49.99', description: '$8.33/mo', isPopular: true },
  { id: '12_mo', title: '12 Months', priceString: '$79.99', description: '$6.66/mo', isPopular: false }
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(1);
  const [packages, setPackages] = useState(MOCK_PACKAGES);
  const [purchasing, setPurchasing] = useState(false);

  const { user, profile, setProfile } = useAuth();

  const handleSubscribe = async () => {
    if (!user) return;
    
    setPurchasing(true);
    try {
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = await upgradeToPremium(user.uid);
      
      if (success) {
        if (profile) {
          setProfile({ ...profile, isPremium: true });
        }
        Alert.alert(
          "👑 Welcome to Vela Gold!",
          "Success! You now have access to See Who Likes You, Unlimited Swipes, and exclusive premium profiles."
        );
        navigation.goBack();
      } else {
        Alert.alert("Error", "Could not process your upgrade at this time.");
      }
    } catch (e) {
      Alert.alert("Error purchasing package", e.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Hero Area */}
        <LinearGradient
          colors={Gradients.premium.colors}
          start={Gradients.premium.start}
          end={Gradients.premium.end}
          style={[styles.hero, { paddingTop: insets.top + Spacing.md }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>👑</Text>
          <Text style={styles.heroTitle}>Vela Gold</Text>
          <Text style={styles.heroSubtitle}>Unlock all premium features to upgrade your dating life.</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Plans */}
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansRow}>
            {packages.map((pkg, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.planCard, selectedPlanIdx === idx && styles.planCardActive]}
                onPress={() => setSelectedPlanIdx(idx)}
              >
                {pkg.packageType === 'ANNUAL' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <Text style={styles.durationText}>{pkg.product.title}</Text>
                <Text style={styles.priceText}>{pkg.product.priceString}</Text>
                <Text style={styles.totalText}>{pkg.product.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Features Comparison */}
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.featuresList}>
            {PREMIUM_FEATURES.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{feature.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Subscribe Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe}>
          <LinearGradient
            colors={Gradients.gold.colors}
            start={Gradients.gold.start}
            end={Gradients.gold.end}
            style={styles.subBtnGradient}
          >
            <Text style={styles.subBtnText}>{purchasing ? "Processing..." : "Continue with Gold"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 120 },
  hero: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], alignItems: 'center', borderBottomLeftRadius: Radius['3xl'], borderBottomRightRadius: Radius['3xl'] },
  closeBtn: { alignSelf: 'flex-start', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  closeText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  heroEmoji: { fontSize: 60, marginBottom: Spacing.sm },
  heroTitle: { fontSize: 32, fontWeight: '900', color: Colors.white },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl },
  content: { padding: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.lg },
  plansRow: { flexDirection: 'row', marginBottom: Spacing.xl, height: 160 },
  planCard: { width: 140, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', marginRight: Spacing.md, justifyContent: 'center', position: 'relative' },
  planCardActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '08' },
  popularBadge: { position: 'absolute', top: -10, backgroundColor: Colors.gold, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  popularText: { color: Colors.white, fontSize: 8, fontWeight: '800' },
  durationText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  priceText: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xs },
  totalText: { fontSize: 12, color: Colors.textMuted },
  featuresList: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border },
  featureEmoji: { fontSize: 28 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  featureDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, backgroundColor: 'transparent' },
  subBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  subBtnGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  subBtnText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
});
