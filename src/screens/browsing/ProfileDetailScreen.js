import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import Chip from '../../components/Chip';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { blockUser, reportUser } from '../../services/UserService';

const { width } = Dimensions.get('window');

export default function ProfileDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = route.params || {};
  const { user: me } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!profile) return null;

  const handleBlock = async () => {
    Alert.alert(
      `Block ${profile.name}?`,
      `You will no longer see each other. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: async () => {
            const success = await blockUser(me?.uid, profile.id);
            if (success) {
              Alert.alert('User blocked');
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    // For simplicity, using a basic alert for reason selection
    // In a real app, this would be a Modal or a separate Screen
    Alert.prompt(
      `Report ${profile.name}`,
      `Please provide a reason for reporting this user (e.g., Fake Profile, Harassment, Inappropriate Content).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: async (reason) => {
            if (!reason) return;
            const success = await reportUser(me?.uid, profile.id, reason);
            if (success) {
              // Automatically block the user after reporting
              await blockUser(me?.uid, profile.id);
              Alert.alert('Report submitted', 'Thank you for keeping the community safe. We have also blocked this user for you.');
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to submit report.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const showSafetyMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', `Report ${profile.name}`, `Block ${profile.name}`],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleReport();
          if (buttonIndex === 2) handleBlock();
        }
      );
    } else {
      // Android fallback
      Alert.alert(
        'Safety Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Report ${profile.name}`, onPress: handleReport },
          { text: `Block ${profile.name}`, onPress: handleBlock, style: 'destructive' },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo Section with indicators */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: profile.photos[activePhotoIndex] }} style={styles.photo} />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + Spacing.sm }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>

          {/* Safety Menu Button */}
          <TouchableOpacity 
            style={[styles.safetyButton, { top: insets.top + Spacing.sm }]} 
            onPress={showSafetyMenu}
          >
            <Text style={styles.backText}>⋮</Text>
          </TouchableOpacity>

          {/* Indicators */}
          <View style={styles.indicators}>
            {profile.photos.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.indicator, activePhotoIndex === i && styles.indicatorActive]}
                onPress={() => setActivePhotoIndex(i)}
              />
            ))}
          </View>

          {/* Scrim Overlay */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.photoScrim}>
            <Text style={styles.photoName}>{profile.name}, {profile.age}</Text>
          </LinearGradient>
        </View>

        {/* Details Card */}
        <View style={styles.detailsContainer}>
          <Text style={styles.jobText}>💼 {profile.job} at {profile.school || 'N/A'}</Text>
          <Text style={styles.distanceText}>📍 Lives in {profile.location} • {profile.distance} miles away</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.chips}>
            {profile.interests.map((interest, idx) => (
              <Chip key={idx} label={interest} selected={true} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons Floating at bottom */}
      <View style={[styles.floatingActions, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={[styles.circleButton, styles.nope]} onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.btnEmoji}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleButton, styles.superLike]} onPress={() => navigation.navigate('SuperLike')}>
          <Text style={styles.btnEmoji}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleButton, styles.like]} onPress={() => {
          navigation.goBack();
          if (profile.id === 'p_001') {
            navigation.navigate('Match', { profile });
          }
        }}>
          <Text style={styles.btnEmoji}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 150 },
  photoContainer: { width: width, height: width * 1.25, position: 'relative' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { position: 'absolute', left: Spacing.xl, width: 40, height: 40, borderRadius: Radius.xl, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  backText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  safetyButton: { position: 'absolute', right: Spacing.xl, width: 40, height: 40, borderRadius: Radius.xl, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  indicators: { position: 'absolute', top: 12, flexDirection: 'row', width: '100%', paddingHorizontal: Spacing.xl, gap: Spacing.xs, zIndex: 10 },
  indicator: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  indicatorActive: { backgroundColor: Colors.white },
  photoScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, justifyContent: 'flex-end', padding: Spacing.xl },
  photoName: { fontSize: 32, fontWeight: '800', color: Colors.white },
  detailsContainer: { padding: Spacing.xl },
  jobText: { fontSize: 16, color: Colors.text, fontWeight: '600', marginBottom: Spacing.sm },
  distanceText: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.md },
  divider: { height: 1.5, backgroundColor: Colors.border, marginVertical: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  bioText: { fontSize: 15, color: Colors.textMuted, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  floatingActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, backgroundColor: 'transparent' },
  circleButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.lg },
  nope: { width: 56, height: 56, borderColor: Colors.passRed, borderWidth: 1.5 },
  superLike: { width: 48, height: 48, borderColor: Colors.superBlue, borderWidth: 1.5 },
  like: { borderColor: Colors.likeGreen, borderWidth: 1.5 },
  btnEmoji: { fontSize: 24 },
});
