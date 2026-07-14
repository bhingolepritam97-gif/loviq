import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { PREMIUM_FEATURES } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { upgradeToPremium } from '../../services/UserService';
import { Purchases } from '../../services/RevenueCatService';

const FALLBACK_PACKAGES = [
  { identifier: 'gold_weekly', packageType: 'WEEKLY', product: { title: 'Vela Gold (1 Week)', priceString: '$6.99', description: 'Billed weekly' } },
  { identifier: 'gold_monthly', packageType: 'MONTHLY', product: { title: 'Vela Gold (1 Month)', priceString: '$14.99', description: 'Most popular · Billed monthly' } },
  { identifier: 'gold_six_month', packageType: 'SIX_MONTH', product: { title: 'Vela Gold (6 Months)', priceString: '$49.99', description: 'Save 44% · Billed half-yearly' } },
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState(FALLBACK_PACKAGES[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, profile, setProfile } = useAuth();

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings?.current?.availablePackages && offerings.current.availablePackages.length > 0) {
          setPackages(offerings.current.availablePackages);
          const defaultPkg = offerings.current.availablePackages.find(p => p.packageType === 'MONTHLY') 
            || offerings.current.availablePackages[0];
          setSelectedPackage(defaultPkg);
        }
      } catch (err) {
        console.warn('[RevenueCat] Failed to load store offerings, using fallbacks:', err.message);
      }
    };
    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!user || !selectedPackage) return;
    setIsProcessing(true);
    try {
      const response = await Purchases.purchasePackage(selectedPackage);
      const isGoldActive = response?.customerInfo?.entitlements?.active?.['gold']?.isActive;
      
      if (isGoldActive) {
        const success = await upgradeToPremium(user.uid);
        if (success) {
          if (profile) setProfile({ ...profile, isPremium: true });
          navigation.goBack();
          return;
        }
      }
      alert('Could not process your upgrade at this time. Please try again.');
    } catch (e) {
      alert('Transaction cancelled or failed: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={Gradients.premium.colors}
          start={Gradients.premium.start}
          end={Gradients.premium.end}
          style={styles.hero}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>👑</Text>
          <Text style={styles.heroTitle}>Vela Gold</Text>
          <Text style={styles.heroSubtitle}>See who liked you, unlimited swipes, and more.</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Plan Picker */}
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          <View style={styles.planColumn}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.planCard, selectedPackage?.identifier === pkg.identifier && styles.planCardSelected]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                  <Text style={styles.planLabel}>{pkg.product.title}</Text>
                  <Text style={styles.planTag}>{pkg.product.description}</Text>
                </View>
                <Text style={[styles.planPrice, selectedPackage?.identifier === pkg.identifier && styles.planPriceSelected]}>
                  {pkg.product.priceString}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feature Comparison Table */}
          <View style={styles.comparisonContainer}>
            <Text style={styles.sectionTitle}>Free vs. Vela Gold</Text>
            <View style={styles.comparisonTable}>
              {/* Header */}
              <View style={[styles.comparisonRow, styles.comparisonHeader]}>
                <Text style={[styles.comparisonCell, styles.comparisonColName, styles.headerText]}>Feature</Text>
                <Text style={[styles.comparisonCell, styles.comparisonColFree, styles.headerText]}>Free</Text>
                <Text style={[styles.comparisonCell, styles.comparisonColGold, styles.headerText, styles.goldHeaderText]}>Gold</Text>
              </View>

              {/* Rows */}
              {[
                { name: 'See Who Likes You', free: 'Blurred', gold: '✨ Reveal 🔑' },
                { name: 'Discovery Swipes', free: '25 / day', gold: '∞ Unlimited' },
                { name: 'Voice & Video Calls', free: 'Standard', gold: '⚡ Priority' },
                { name: 'Location Search', free: 'Local Only', gold: '🌍 Passport' },
                { name: 'Discovery Boost', free: 'Standard', gold: '🔥 2.5x Views' },
              ].map((item, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.comparisonRow, 
                    idx % 2 === 1 && styles.comparisonRowAlt,
                    idx === 4 && styles.comparisonRowLast
                  ]}
                >
                  <Text style={[styles.comparisonCell, styles.comparisonColName, styles.cellText]}>{item.name}</Text>
                  <Text style={[styles.comparisonCell, styles.comparisonColFree, styles.cellText, styles.crossText]}>{item.free}</Text>
                  <Text style={[styles.comparisonCell, styles.comparisonColGold, styles.cellText, styles.tickText]}>{item.gold}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={Gradients.gold.colors}
            start={Gradients.gold.start}
            end={Gradients.gold.end}
            style={styles.purchaseGradient}
          >
            {isProcessing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.purchaseButtonText}>Continue</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Always-visible escape hatch — no guilt-tripping */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.maybeLaterBtn}>
          <Text style={styles.maybeLater}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 140 },

  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    borderBottomLeftRadius: Radius['3xl'],
    borderBottomRightRadius: Radius['3xl'],
  },
  closeBtn: {
    alignSelf: 'flex-start', width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  closeText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  heroEmoji: { fontSize: 60, marginBottom: Spacing.sm },
  heroTitle: { fontSize: 32, fontWeight: '900', color: Colors.white },
  heroSubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    marginTop: Spacing.sm, paddingHorizontal: Spacing.xl,
  },

  content: { padding: Spacing.xl },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.text,
    marginBottom: Spacing.md, marginTop: Spacing.lg,
  },

  planColumn: { gap: 12, marginBottom: Spacing.xl },
  planCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg,
    padding: Spacing.md, backgroundColor: Colors.surface,
  },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '0D' },
  planLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  planTag: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  planPrice: { fontSize: 16, fontWeight: '700', color: Colors.text },
  planPriceSelected: { color: Colors.primary },

  // Comparison Grid Styles
  comparisonContainer: { marginTop: Spacing.md, marginBottom: Spacing.md },
  comparisonTable: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.surface },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: Colors.border },
  comparisonRowAlt: { backgroundColor: 'rgba(0,0,0,0.02)' },
  comparisonRowLast: { borderBottomWidth: 0 },
  comparisonHeader: { backgroundColor: '#1C1A2E', borderBottomWidth: 2, borderColor: Colors.border },
  comparisonCell: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs, fontSize: 12, textAlign: 'center' },
  comparisonColName: { flex: 1.3, textAlign: 'left', paddingLeft: Spacing.md },
  comparisonColFree: { flex: 0.8, color: Colors.textMuted },
  comparisonColGold: { flex: 1.0, fontWeight: '700', backgroundColor: '#FF3A5C08' },
  headerText: { fontWeight: '700', color: Colors.white, fontSize: 12 },
  goldHeaderText: { color: '#FFD700' },
  cellText: { color: Colors.text },
  crossText: { color: Colors.textMuted },
  tickText: { color: '#FF3A5C', fontWeight: '700' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  purchaseButton: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadow.md },
  purchaseGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  purchaseButtonText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  maybeLaterBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  maybeLater: { color: Colors.textMuted, fontSize: 14 },
});
