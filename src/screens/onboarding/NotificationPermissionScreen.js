import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients } from '../../theme';
import Button from '../../components/Button';
import OnboardingHeader from '../../components/OnboardingHeader';
import { useAuth } from '../../context/AuthContext';
import { createUserProfile } from '../../services/UserService';

export default function NotificationPermissionScreen({ route, navigation }) {
  const { name, birthday, age, gender, showGender, interestedIn, intent, interests, bio, photos } = route.params || { name: 'User', birthday: '', age: 18, gender: '', showGender: true, interestedIn: [], intent: '', interests: [], bio: '', photos: [] };
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  const { user, setProfile } = useAuth();

  const handleFinish = async () => {
    setLoading(true);
    const profileData = {
      name,
      birthday,
      age,
      gender,
      showGender,
      interestedIn,
      intent,
      interests,
      bio,
      photos,
      profileComplete: true
    };

    console.log('🎉 ONBOARDING COMPLETED PROFILE:', profileData);
    
    if (user) {
      try {
        await createUserProfile(user.uid, profileData);
        setProfile(profileData);
        // AppNavigator will switch to Main automatically
      } catch (err) {
        console.error('Failed to save profile:', err);
        navigation.replace('Main');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      navigation.replace('Main');
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.primary.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={12}
        totalSteps={12}
        title="Permissions"
        subtitle="Step 6 of 6"
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: Spacing.xl }]} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            One last thing — enable notifications so you never miss a match or message from someone special.
          </Text>

          <View style={styles.notifCard}>
            <Text style={styles.notifIcon}>💌</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>Loviq</Text>
              <Text style={styles.notifBody}>You have a new match! 🎉</Text>
            </View>
          </View>

          <Text style={styles.finePrint}>You can manage notifications in Settings at any time.</Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <Button
          label="Enable Notifications 🔔"
          variant="ghost"
          style={{ backgroundColor: Colors.white, ...styles.whiteBtn }}
          labelStyle={{ color: Colors.primary }}
          onPress={handleFinish}
          loading={loading}
          disabled={loading}
        />
        <Button
          label="Maybe Later"
          variant="ghost"
          style={{ marginTop: Spacing.sm }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          onPress={handleFinish}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 140 },
  content: { paddingHorizontal: Spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 72, marginBottom: Spacing.xl },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', color: Colors.white, textAlign: 'center', letterSpacing: -1, marginBottom: Spacing.base },
  subtitle: { fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.xl, padding: Spacing.base, alignSelf: 'stretch', marginBottom: Spacing.xl },
  notifIcon: { fontSize: 24 },
  notifTitle: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.white },
  notifBody: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  finePrint: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  whiteBtn: { shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.md, backgroundColor: 'transparent' },
});
