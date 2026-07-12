import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Gradients } from '../../theme';
import Button from '../../components/Button';

const { width, height } = Dimensions.get('window');

const CARDS = [
  { id: 1, photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600', name: 'Sofia, 25', rotate: '-8deg', top: 30, left: width * 0.05 },
  { id: 2, photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600', name: 'Mia, 27', rotate: '5deg', top: 70, left: width * 0.48 },
  { id: 3, photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', name: 'Zara, 24', rotate: '-3deg', top: 20, left: width * 0.22 },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient blobs */}
      <LinearGradient colors={['#FFE0F0', '#FFF0E8', '#FAFAFA']} style={StyleSheet.absoluteFill} />

      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Floating profile cards area */}
        <View style={styles.cardsArea}>
          {CARDS.map((card) => (
            <Animated.View
              key={card.id}
              style={[
                styles.floatingCard, 
                { 
                  top: card.top, 
                  left: card.left, 
                  transform: [{ rotate: card.rotate }], 
                  opacity: fadeAnim 
                }
              ]}
            >
              <Image source={{ uri: card.photo }} style={styles.cardImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.cardScrim}>
                <Text style={styles.cardName}>{card.name}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        {/* Bottom content section */}
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>💜</Text>
            <Text style={styles.logoText}>Loviq</Text>
          </View>
          <Text style={styles.headline}>Find someone who gets you</Text>
          <Text style={styles.subtext}>
            Real connections. Real people. Your perfect match is closer than you think.
          </Text>

          <View style={styles.buttonGroup}>
            <Button label="Get Started" onPress={() => navigation.navigate('PhoneEmail')} />
            <Button
              label="I already have an account"
              variant="ghost"
              style={styles.loginBtn}
              onPress={() => navigation.navigate('PhoneEmail')}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'space-between' },
  cardsArea: { height: 280, position: 'relative', width: '100%', marginBottom: Spacing.xl },
  floatingCard: {
    position: 'absolute',
    width: width * 0.40,
    height: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
    backgroundColor: Colors.surface,
  },
  cardImage: { width: '100%', height: '100%' },
  cardScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, height: '50%', justifyContent: 'flex-end' },
  cardName: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  bottomSection: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.sm,
    justifyContent: 'flex-end',
    width: '100%',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  logoEmoji: { fontSize: Typography.fontSize['3xl'], marginRight: Spacing.sm },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
  headline: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.8,
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  subtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  buttonGroup: { gap: Spacing.md },
  loginBtn: { marginTop: -Spacing.sm },
});
