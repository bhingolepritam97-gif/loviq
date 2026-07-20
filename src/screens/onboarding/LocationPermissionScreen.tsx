import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { ResponsiveContainer, ResponsiveScreen, useBreakpoints } from '../../core/responsive';

const STEPS_TOTAL = 13;

const BENEFITS = [
  {
    icon: 'heart-outline',
    title: 'See who\'s near you',
    desc: 'Discover meaningful connections within your preferred distance.',
  },
  {
    icon: 'navigate-outline',
    title: 'Distance badge on cards',
    desc: 'Show how close you are — sparks real-life meetups faster.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Privacy-first',
    desc: 'Your exact address is never shared. Only approximate distance is shown.',
  },
];

export default function LocationPermissionScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoints();

  // Pulse animation for location pin
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      console.log('[LocationPermissionScreen] Location permission:', status);

      if (!granted) {
        Alert.alert(
          'Location Not Enabled',
          'You can enable location in your device settings later. We\'ll use a default location for now.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.warn('[LocationPermissionScreen] Permission request error:', err.message);
      setPermissionGranted(false);
    } finally {
      setLoading(false);
      navigateNext();
    }
  };

  const handleSkip = () => {
    console.log('[LocationPermissionScreen] User skipped location permission.');
    navigateNext();
  };

  const navigateNext = () => {
    navigation.navigate('PhotoUpload', {
      ...route.params,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#130516', '#22082b']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      
      <ResponsiveScreen keyboardAvoiding scrollable backgroundColor="transparent">
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { paddingTop: insets.top }]}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(6 / STEPS_TOTAL) * 100}%` }]} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitleText}>Location</Text>
            <Text style={styles.headerStepText}>Step 6 of 13</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Inner Form with Desktop support */}
        <View style={styles.innerForm}>
          {/* Content */}
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Pulsing Location Pin */}
            <View style={styles.iconArea}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={['#E8628F', '#C53D6B']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="location" size={36} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.title}>Enable Location</Text>
            <Text style={styles.subtitle}>
              Help us find your{' '}
              <Text style={styles.accentText}>perfect match nearby.</Text>
              {'\n'}We only use your general area — never your exact address.
            </Text>

            {/* Benefits list */}
            <View style={styles.benefitsList}>
              {BENEFITS.map((item, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <View style={styles.benefitIconCircle}>
                    <Ionicons name={item.icon as any} size={18} color="#E8628F" />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{item.title}</Text>
                    <Text style={styles.benefitDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.allowBtn}
              onPress={handleAllow}
              disabled={loading}
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Allow Location Access"
            >
              <LinearGradient
                colors={Gradients.primary.colors}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.allowGradient}
              >
                <Ionicons name="location-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.allowText}>
                  {loading ? 'Requesting...' : 'Allow Location Access'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Skip location permission for now"
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Not now — skip this step</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveScreen>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130516',
  },

  progressContainer: { width: '100%' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressBarFill: { height: '100%', backgroundColor: '#E8628F' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 60,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  headerTitleCenter: { alignItems: 'center' },
  headerTitleText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerStepText: { fontSize: 11, fontWeight: '700', color: '#E8628F', marginTop: 1 },

  innerForm: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  content: {
    alignItems: 'center',
  },

  iconArea: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(232, 98, 143, 0.12)',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...Shadow.primary,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF0F3',
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#A592A5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  accentText: {
    color: '#E8628F',
    fontWeight: '700',
  },

  benefitsList: {
    width: '100%',
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  benefitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(232, 98, 143, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF0F3',
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#A592A5',
    lineHeight: 16,
  },

  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  allowBtn: {
    width: '100%',
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadow.primary,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  allowGradient: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btnIcon: {
    marginTop: 1,
  },
  allowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} })
  },
  skipText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '500',
  },
});
