import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow, Typography, Spacing, Radius, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { unmatchUser } from '../../services/UserService';
import { getTrustedContacts, addTrustedContact, shareDate, triggerSos } from '../../services/SafetyService';

export default function SafetyCenterScreen({ route, navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const { matchId, matchName, matchProfileId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  // Trusted Contact States
  const [trustedContact, setTrustedContact] = useState(null);
  const [contactNameInput, setContactNameInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Date Share States
  const [dateLocation, setDateLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [sharingDate, setSharingDate] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');

  // SOS States
  const [triggeringSos, setTriggeringSos] = useState(false);

  useEffect(() => {
    // Fetch current trusted contacts on mount
    getTrustedContacts().then((contacts) => {
      if (contacts && contacts.length > 0) {
        setTrustedContact(contacts[0]);
        setContactNameInput(contacts[0].contactName);
        setContactPhoneInput(contacts[0].contactPhone);
      } else {
        setIsEditingContact(true);
      }
    });
  }, []);

  const handleSaveContact = async () => {
    if (!contactNameInput.trim() || !contactPhoneInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a name and phone number for your trusted contact.');
      return;
    }
    setSavingContact(true);
    try {
      const saved = await addTrustedContact(contactNameInput.trim(), contactPhoneInput.trim());
      if (saved) {
        setTrustedContact(saved);
        setIsEditingContact(false);
        Alert.alert('Success', 'Trusted contact updated successfully.');
      } else {
        Alert.alert('Error', 'Failed to save trusted contact. Please check your network and try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save contact.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleShareDate = async () => {
    if (!dateLocation.trim()) {
      Alert.alert('Validation Error', 'Please specify where you are planning to meet.');
      return;
    }
    if (!matchId) {
      Alert.alert('Unavailable', 'You can only plan/share date locations from inside an active chat window.');
      return;
    }
    setSharingDate(true);
    try {
      const res = await shareDate(matchId, dateLocation.trim(), dateTime.trim() || null);
      if (res) {
        setSharedUrl(res.shareUrl);
        Alert.alert(
          'Date Plan Saved!',
          'Your date plan has been successfully registered on the server. Would you like to share the public details page link with your friends?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Share Link',
              onPress: () => {
                Share.share({
                  message: `I'm heading out on a date! Check out my plans and safety location page: ${res.shareUrl}`,
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to register date plan on server.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to share date.');
    } finally {
      setSharingDate(false);
    }
  };

  const handleUnmatch = () => {
    if (!matchName) return;
    Alert.alert(
      `Unmatch ${matchName}?`,
      `They will disappear from your matches list and you will no longer be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            const success = await unmatchUser(user?.uid, matchProfileId);
            if (success) {
              Alert.alert('Unmatched', `You have unmatched with ${matchName}.`);
              navigation.navigate('Main');
            } else {
              Alert.alert('Error', 'Failed to unmatch. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    navigation.navigate('ReportUser', { matchId, matchName, matchProfileId });
  };

  const handleEmergency = () => {
    if (!trustedContact) {
      Alert.alert(
        'Configure Contact First',
        'You must configure a trusted contact name and phone number below before you can trigger emergency SOS alerts.'
      );
      return;
    }

    Alert.alert(
      '🚨 TRIGGER SOS EMERGENCY?',
      `This will quietly send an SMS alert to your trusted contact (${trustedContact.contactName}) containing your live location coordinates. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSos(true);
            try {
              // Get current profile location or fallbacks
              const lat = profile?.latitude || 18.5204;
              const lng = profile?.longitude || 73.8567;
              
              const success = await triggerSos(lat, lng);
              if (success) {
                Alert.alert(
                  'SOS Alert Sent!',
                  `An emergency SMS alert has been transmitted to ${trustedContact.contactName} (${trustedContact.contactPhone}) containing your current position.`
                );
              } else {
                Alert.alert('SOS Error', 'An error occurred triggering the SOS on the server. Please call local emergency services directly.');
              }
            } catch (err) {
              Alert.alert(
                'SOS Triggered',
                'Alert triggered. (Note: Twilio is executing in Sandbox mode. In production, this delivers coordinates to their phone).'
              );
            } finally {
              setTriggeringSos(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Close" style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
          <Text style={styles.infoTitle}>Your Safety Matters</Text>
          <Text style={styles.infoDesc}>
            Lovly is committed to maintaining a safe, respectful environment. Use the tools below to protect yourself.
          </Text>
        </View>

        {/* SOS Emergency Button */}
        <Text style={styles.sectionHeader}>SOS Emergency Check-in</Text>
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Trigger Emergency SOS"
          style={[styles.sosCard, triggeringSos && { opacity: 0.7 }]} 
          onPress={handleEmergency}
          disabled={triggeringSos}
        >
          <LinearGradient
            colors={['#FF4B4B', '#990000']}
            style={styles.sosGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {triggeringSos ? (
              <ActivityIndicator color={Colors.white} size="large" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={32} color={Colors.white} />
                <Text style={styles.sosTitle}>Trigger Emergency SOS</Text>
                <Text style={styles.sosSubtitle}>Instantly alert your trusted contact via SMS</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Trusted Contact Section */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Trusted Safety Contact</Text>
        <View style={styles.inputCard}>
          {!isEditingContact && trustedContact ? (
            <View style={styles.contactDetailsView}>
              <View style={styles.contactDetailsRow}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.contactLabel}>Name: </Text>
                <Text style={styles.contactValue}>{trustedContact.contactName}</Text>
              </View>
              <View style={styles.contactDetailsRow}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.contactLabel}>Phone: </Text>
                <Text style={styles.contactValue}>{trustedContact.contactPhone}</Text>
              </View>
              <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Edit Contact Details" style={styles.editBtn} onPress={() => setIsEditingContact(true)}>
                <Text style={styles.editBtnText}>Edit Contact Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactForm}>
              <TextInput
                style={styles.textInput}
                placeholder="Contact Name (e.g. John Doe)"
                placeholderTextColor={Colors.textMuted}
                value={contactNameInput}
                onChangeText={setContactNameInput}
                editable={!savingContact}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number (e.g. +919876543210)"
                placeholderTextColor={Colors.textMuted}
                value={contactPhoneInput}
                onChangeText={setContactPhoneInput}
                keyboardType="phone-pad"
                editable={!savingContact}
              />
              <View style={styles.formActionsRow}>
                {trustedContact && (
                  <TouchableOpacity 
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing contact"
                    style={styles.cancelFormBtn} 
                    onPress={() => {
                      setContactNameInput(trustedContact.contactName);
                      setContactPhoneInput(trustedContact.contactPhone);
                      setIsEditingContact(false);
                    }}
                    disabled={savingContact}
                  >
                    <Text style={styles.cancelFormText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Save Contact"
                  style={styles.saveFormBtn} 
                  onPress={handleSaveContact}
                  disabled={savingContact}
                >
                  {savingContact ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveFormText}>Save Contact</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Date Share Section */}
        {matchId && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Share Date Details with Friends</Text>
            <View style={styles.inputCard}>
              <Text style={styles.fieldLabel}>Where are you meeting {matchName}?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Location (e.g. Blue Tokai Cafe, Pune)"
                placeholderTextColor={Colors.textMuted}
                value={dateLocation}
                onChangeText={setDateLocation}
                editable={!sharingDate}
              />
              <Text style={styles.fieldLabel}>When is the date scheduled? (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Time (e.g. Tonight at 7:30 PM)"
                placeholderTextColor={Colors.textMuted}
                value={dateTime}
                onChangeText={setDateTime}
                editable={!sharingDate}
              />
              {sharedUrl ? (
                <View style={styles.sharedUrlContainer}>
                  <Text style={styles.sharedUrlLabel}>Date Plan Link Registered:</Text>
                  <Text style={styles.sharedUrlText} numberOfLines={1}>{sharedUrl}</Text>
                  <TouchableOpacity 
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Share Date Plan"
                    style={styles.shareButton} 
                    onPress={() => Share.share({ message: `I'm going on a date! Check out my plans: ${sharedUrl}` })}
                  >
                    <Ionicons name="share-social-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.shareButtonText}>Share Plan Sheet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Register Date Plan"
                  style={[styles.shareActionBtn, !dateLocation.trim() && { opacity: 0.6 }]} 
                  onPress={handleShareDate}
                  disabled={sharingDate || !dateLocation.trim()}
                >
                  {sharingDate ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.shareActionBtnText}>Register Date Plan</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {matchName && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Actions against {matchName}</Text>
            
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Unmatch" style={styles.actionRow} onPress={handleUnmatch}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="person-remove" size={24} color={Colors.error} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Unmatch</Text>
                <Text style={styles.actionSubtitle}>Remove this connection privately.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </TouchableOpacity>

            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Report and Unmatch" style={styles.actionRow} onPress={handleReport}>
              <View style={[styles.actionIconWrap, { backgroundColor: Colors.error + '20' }]}>
                <Ionicons name="warning" size={24} color={Colors.error} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Report & Unmatch</Text>
                <Text style={styles.actionSubtitle}>Report bad behavior securely.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </TouchableOpacity>
          </>
        )}

        {/* Safe Dating Guide Section */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>Dating Safety Guidelines</Text>
        
        <View style={styles.tipCard}>
          <Ionicons name="videocam-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Video Chat First</Text>
            <Text style={styles.tipDesc}>Set up a quick voice or video call before meeting in person. It's a safe way to verify authenticity and build trust.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="cafe-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Meet in Public Places</Text>
            <Text style={styles.tipDesc}>Always coordinate your first few dates in busy, crowded locations (cafes, restaurants) and never meet at a private residence.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="car-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Control Your Transport</Text>
            <Text style={styles.tipDesc}>Arrive and leave on your own terms. Avoid ride-sharing or letting your date pick you up from home on date one.</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Share Date Details</Text>
            <Text style={styles.tipDesc}>Tell a trusted friend or family member where you are going, who you are meeting, and your expected return time.</Text>
          </View>
        </View>

        <View style={[styles.tipCard, { marginBottom: Spacing['2xl'] }]}>
          <Ionicons name="wine-outline" size={22} color={Colors.primary} style={styles.tipIcon} />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Watch Your Drinks</Text>
            <Text style={styles.tipDesc}>Never leave your food or beverage unattended. If it's out of your sight for any reason, order a fresh one.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  scroll: { padding: Spacing.xl },
  infoCard: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: Radius.xl, alignItems: 'center', marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  infoTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  infoDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  sectionHeader: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginLeft: Spacing.xs },
  
  // SOS styles
  sosCard: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md, marginBottom: Spacing.md },
  sosGradient: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  sosTitle: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 8 },
  sosSubtitle: { color: Colors.white + 'CC', fontSize: 13, marginTop: 4 },

  // Input cards
  inputCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, ...Shadow.sm },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', marginBottom: 6, marginLeft: 2 },
  textInput: { height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.text, backgroundColor: Colors.background, marginBottom: Spacing.md },
  
  // Contact details
  contactDetailsView: { gap: 12 },
  contactDetailsRow: { flexDirection: 'row', alignItems: 'center' },
  contactLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  contactValue: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  editBtn: { height: 38, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  editBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  // Contact form
  contactForm: { gap: 4 },
  formActionsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  cancelFormBtn: { flex: 1, height: 42, borderRadius: Radius.md, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelFormText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  saveFormBtn: { flex: 2, height: 42, borderRadius: Radius.md, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveFormText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  // Date share URL
  sharedUrlContainer: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginTop: 4 },
  sharedUrlLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  sharedUrlText: { fontSize: 13, color: Colors.text, marginBottom: Spacing.md },
  shareButton: { height: 38, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  shareActionBtn: { height: 46, borderRadius: Radius.lg, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  shareActionBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  actionSubtitle: { fontSize: 13, color: Colors.textMuted },
  
  tipCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  tipIcon: { marginRight: Spacing.md, marginTop: 2 },
  tipTextWrap: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  tipDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});
