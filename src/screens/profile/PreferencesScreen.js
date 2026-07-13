import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Button from '../../components/Button';

import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/UserService';

const SHOW_ME_OPTIONS = ['Women', 'Men', 'Everyone'];

export default function PreferencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();
  
  const [distance, setDistance] = useState(profile?.distance_range || 25);
  const [globalMode, setGlobalMode] = useState(profile?.global_mode || false);
  const [ageRange, setAgeRange] = useState(profile?.age_range || [20, 35]);
  const [showMe, setShowMe] = useState(profile?.interestedIn || 'Women');

  const handleSave = async () => {
    if (user && profile) {
      const updatedPrefs = {
        distance_range: distance,
        global_mode: globalMode,
        age_range: ageRange,
        interestedIn: showMe
      };
      setProfile({ ...profile, ...updatedPrefs });
      await updateUserProfile(user.uid, updatedPrefs);
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Discovery Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Global Mode Preference */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardTitle}>Global Mode</Text>
            <Switch
              value={globalMode}
              onValueChange={setGlobalMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <Text style={styles.cardDesc}>Going global allows you to match with people around the world.</Text>
        </View>

        {/* Distance Preference */}
        {!globalMode && (
          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.cardTitle}>Maximum Distance</Text>
              <Text style={styles.cardVal}>{distance} miles</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={distance}
              onValueChange={(val) => setDistance(val)}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
          </View>
        )}

        {/* Age Preference */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardTitle}>Age Range</Text>
            <Text style={styles.cardVal}>{ageRange[0]} - {ageRange[1]}</Text>
          </View>
          <View style={styles.sliderMock}>
            {[[18, 25], [20, 35], [25, 45], [30, 60]].map(([min, max]) => (
              <TouchableOpacity
                key={min}
                style={[styles.sliderOption, ageRange[0] === min && styles.sliderOptionActive]}
                onPress={() => setAgeRange([min, max])}
              >
                <Text style={[styles.sliderText, ageRange[0] === min && styles.sliderTextActive]}>{min}-{max}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Show Me Preference */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Show Me</Text>
          <View style={styles.genderRow}>
            {SHOW_ME_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.genderBtn, showMe === opt && styles.genderBtnActive]}
                onPress={() => setShowMe(opt)}
              >
                <Text style={[styles.genderText, showMe === opt && styles.genderTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button 
          label="Save Preferences" 
          onPress={handleSave}
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.xl },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardVal: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardDesc: { fontSize: 13, color: Colors.textMuted, marginTop: Spacing.xs, lineHeight: 18 },
  sliderMock: { flexDirection: 'row', gap: Spacing.sm },
  sliderOption: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  sliderOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  sliderText: { fontSize: 13, color: Colors.textMuted },
  sliderTextActive: { color: Colors.primary, fontWeight: '700' },
  genderRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  genderBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  genderText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  genderTextActive: { color: Colors.primary },
});
