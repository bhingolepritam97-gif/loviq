import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchMatchMessages, sendMessage, subscribeToMessages, updateTypingStatus, markMessagesAsRead, fetchIcebreakers } from '../../services/ChatService';
import { socketService } from '../../api/socket';
import { uploadImageToFirebase, pickImageFromLibrary, takePhotoWithCamera, requestCameraAndGalleryPermissions } from '../../services/ImageService';
import { useBreakpoints } from '../../core/responsive';

const ICEBREAKERS = [
  "What's your absolute go-to Sunday activity? ☀️",
  "Tell me one thing on your bucket list this year! ✈️",
  "If you could only eat one cuisine for the rest of your life, what is it? 🍕",
  "What's the best travel trip you've ever taken? 🏔️"
];

export default function ChatScreen({ route, navigation, matchIdProp, profileProp }: any) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { isPhone } = useBreakpoints();
  const isEmbedded = !isPhone;

  const matchId = matchIdProp || route?.params?.matchId;
  const initialProfile = profileProp || route?.params?.profile;
  const [profile, setProfile] = useState(initialProfile || null);
  const [messages, setMessages] = useState([]);
  const [icebreakers, setIcebreakers] = useState(ICEBREAKERS);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  useEffect(() => {
    if (matchId) {
      fetchIcebreakers(matchId).then((starters) => {
        if (starters && starters.length > 0) {
          setIcebreakers(starters);
        }
      });
    }
  }, [matchId]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Women Message First restriction state
  const [matchRestriction, setMatchRestriction] = useState({
    restrictedMode: route.params?.restrictedMode || false,
    onlyUserIdCanMessageFirst: route.params?.onlyUserIdCanMessageFirst || null,
    messageDeadline: route.params?.messageDeadline || null,
    firstMessageSent: route.params?.firstMessageSent || false,
  });
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const { user, profile: currentUserProfile } = useAuth();

  // Compute whether this user is blocked from sending the first message
  const isInputBlocked = matchRestriction.restrictedMode &&
    !matchRestriction.firstMessageSent &&
    matchRestriction.onlyUserIdCanMessageFirst !== null &&
    matchRestriction.onlyUserIdCanMessageFirst !== currentUserProfile?.id;

  const handleAttach = async () => {
    const hasPerms = await requestCameraAndGalleryPermissions();
    if (!hasPerms) {
      Alert.alert('Permission Denied', 'Camera and gallery access is required to share photos.');
      return;
    }

    Alert.alert(
      'Share Image',
      'Choose an option to upload and share an image',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const res = await takePhotoWithCamera();
              if (!res.canceled && res.assets?.[0]?.uri) {
                uploadAndSendImage(res.assets[0].uri);
              }
            } catch (err) {
              console.error('Camera capture error:', err);
            }
          }
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            try {
              const res = await pickImageFromLibrary();
              if (!res.canceled && res.assets?.[0]?.uri) {
                uploadAndSendImage(res.assets[0].uri);
              }
            } catch (err) {
              console.error('Gallery pick error:', err);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadAndSendImage = async (uri) => {
    setIsUploading(true);
    try {
      const downloadURL = await uploadImageToFirebase(uri);
      if (downloadURL) {
        await proceedSend(`[image]${downloadURL}`);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Upload Failed', 'Could not upload image. Please check your internet connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!matchId) return;

    // Reset states for the new conversation to prevent flicker
    setLoading(true);
    setMessages([]);
    setHasMoreMessages(true);

    let unsubscribe = () => {};

    const loadData = async () => {
      // If profile is missing (e.g. from a push notification deep link), fetch it
      if (!profile) {
        const { fetchMatch } = require('../../services/ChatService');
        const matchData = await fetchMatch(matchId);
        if (matchData) {
          if (matchData.otherUser) setProfile(matchData.otherUser);
          // Hydrate restriction fields from match data
          setMatchRestriction({
            restrictedMode: matchData.restrictedMode || false,
            onlyUserIdCanMessageFirst: matchData.onlyUserIdCanMessageFirst || null,
            messageDeadline: matchData.messageDeadline || null,
            firstMessageSent: matchData.firstMessageSent || false,
          });
        }
      }

      // Initial fetch
      const fetched = await fetchMatchMessages(matchId, null, 20);
      setMessages(fetched.reverse()); // Store descending for inverted list
      if (fetched.length < 20) setHasMoreMessages(false);
      setLoading(false);

      // Subscribe to real-time updates via WebSocket
      unsubscribe = subscribeToMessages(matchId, (newMessage) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [newMessage, ...prev]; // Prepend for inverted list
        });
        if (currentUserProfile) markMessagesAsRead(matchId, currentUserProfile.id);
        
        // Auto-unlock chat if any message is received (indicates conversation started!)
        setMatchRestriction(prev => ({
          ...prev,
          firstMessageSent: true,
        }));
      });
    };

    loadData();
    
    // Subscribe to typing status events via WebSocket
    const socket = socketService.getSocket();
    const handleTypingEvent = ({ senderId, isTyping }: any) => {
      if (profile && senderId === profile.id) {
        setIsTyping(isTyping);
      }
    };
    const handleMatchUnlockedEvent = (data: any) => {
      if (data && data.matchId === matchId) {
        setMatchRestriction(prev => ({
          ...prev,
          firstMessageSent: true,
        }));
      }
    };
    if (socket) {
      socket.on("typing", handleTypingEvent);
      socket.on("match_unlocked", handleMatchUnlockedEvent);
    }

    return () => {
      unsubscribe();
      if (socket) {
        socket.off("typing", handleTypingEvent);
        socket.off("match_unlocked", handleMatchUnlockedEvent);
      }
    };
  }, [matchId, profile]);

  const HARASSMENT_BLACKLIST = ['idiot', 'stupid', 'ugly', 'die', 'kill', 'bitch'];

  const loadOlderMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;
    setIsLoadingMore(true);

    const oldestMessageId = messages[messages.length - 1].id; // Last element is oldest because it's inverted

    const olderMessages = await fetchMatchMessages(matchId, oldestMessageId, 20);
    if (olderMessages.length < 20) {
      setHasMoreMessages(false);
    }
    
    setMessages(prev => [...prev, ...olderMessages.reverse()]);
    setIsLoadingMore(false);
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const messageText = text;

    // AI Harassment Filter (Mock)
    const lowerText = messageText.toLowerCase();
    const hasBadWords = HARASSMENT_BLACKLIST.some(word => lowerText.includes(word));
    
    if (hasBadWords) {
      Alert.alert(
        '⚠️ Warning',
        'Does this message seem inappropriate? Please keep our community safe and respectful.',
        [
          { text: 'Edit Message', style: 'cancel' },
          { 
            text: 'Send Anyway', 
            style: 'destructive',
            onPress: () => proceedSend(messageText)
          }
        ]
      );
      return;
    }

    proceedSend(messageText);
  };

  const proceedSend = async (messageText) => {
    setText('');
    if (currentUserProfile) updateTypingStatus(matchId, currentUserProfile.id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    try {
      await sendMessage(matchId, currentUserProfile?.id, messageText);
      // If match was restricted, unlock it locally after first successful send
      if (matchRestriction.restrictedMode && !matchRestriction.firstMessageSent) {
        setMatchRestriction(prev => ({ ...prev, firstMessageSent: true }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setText(messageText);
      Alert.alert('Send Failed ⚠️', 'Unable to send message. Please check your internet connection and try again.');
    }
  };

  const handleTextChange = (newText) => {
    setText(newText);
    if (!currentUserProfile) return;
    
    updateTypingStatus(matchId, currentUserProfile.id, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(matchId, currentUserProfile.id, false);
    }, 2000);
  };

  const openSafetyCenter = () => {
    navigation.navigate('SafetyCenter', { 
      matchId, 
      matchName: profile?.name || 'User',
      matchProfileId: profile?.id 
    });
  };

  const handleCallPress = (callType) => {
    // Safety warning before the first call
    Alert.alert(
      'Safety First 🛡️',
      'Keep it clean! Our AI monitors video/audio calls for safety. Any inappropriate behavior will result in a permanent ban. Do you agree?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Agree', 
          onPress: () => {
            navigation.navigate('CallRinging', { profile, callType });
          } 
        }
      ]
    );
  };

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    // Show button if we scroll up more than 150px (since list is inverted, scrolling up increases y)
    setShowScrollButton(contentOffset.y > 150);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={styles.header}>
        {!isEmbedded && (
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`View ${profile.name}'s profile`}
          style={styles.profileMeta} 
          onPress={() => navigation.navigate('ProfileDetail', { profile })}
        >
          <Avatar uri={profile.photos?.[0]} name={profile.name} size={40} showOnline={profile.isOnline} />
          <View>
            <Text style={styles.headerName}>{profile.name}</Text>
            <Text style={styles.activeText}>{profile.isOnline ? 'Active Now' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Audio call" onPress={() => handleCallPress('audio')}>
            <Ionicons name="call" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Video call" onPress={() => handleCallPress('video')}>
            <Ionicons name="videocam" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Safety options" onPress={openSafetyCenter} style={{ marginLeft: Spacing.xs }}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} style={styles.optionsIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Scroll Area */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.skeletonBubble, 
                index % 2 === 0 ? styles.skeletonOther : styles.skeletonMe,
                { width: Math.random() * 100 + 100 }
              ]} 
            />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          keyboardDismissMode="on-drag"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          inverted={true}
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={[styles.icebreakerContainer, { transform: [{ scaleY: -1 }] }]}>
              <Text style={styles.icebreakerHeader}>⚡ Spark a conversation</Text>
              <Text style={styles.icebreakerSubtitle}>Select an icebreaker to start the chat:</Text>
              <View style={styles.icebreakerList}>
                {icebreakers.map((prompt, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Select icebreaker: ${prompt}`}
                    style={styles.icebreakerCard} 
                    onPress={() => setText(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.icebreakerText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: Spacing.md }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserProfile?.id;
            const isImage = item.text && item.text.startsWith('[image]');
            const imageUrl = isImage ? item.text.substring(7) : null;

            return (
              <View style={[styles.messageWrapper, isMe ? styles.wrapperMe : styles.wrapperOther, { transform: [{ scaleY: -1 }] }]}>
                <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
                  {!isMe && (
                    <Image source={{ uri: profile.photos?.[0] }} style={styles.bubbleAvatar} />
                  )}
                  
                  {isMe ? (
                    isImage ? (
                      <View style={[styles.bubble, styles.bubbleMe, { padding: 4, overflow: 'hidden' }]}>
                        <Image source={{ uri: imageUrl }} style={styles.bubbleImage} />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={Gradients.primary.colors}
                        start={Gradients.primary.start}
                        end={Gradients.primary.end}
                        style={[styles.bubble, styles.bubbleMe]}
                      >
                        <Text style={[styles.bubbleText, styles.textMe]}>{item.text}</Text>
                      </LinearGradient>
                    )
                  ) : (
                    isImage ? (
                      <View style={[styles.bubble, styles.bubbleOther, { padding: 4, overflow: 'hidden' }]}>
                        <Image source={{ uri: imageUrl }} style={styles.bubbleImage} />
                      </View>
                    ) : (
                      <View style={[styles.bubble, styles.bubbleOther]}>
                        <Text style={[styles.bubbleText, styles.textOther]}>{item.text}</Text>
                      </View>
                    )
                  )}
                </View>
                <View style={styles.timestampRow}>
                  <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampOther]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {isMe && (
                    <Ionicons 
                      name={item.read ? "checkmark-done" : "checkmark"} 
                      size={14} 
                      color={item.read ? Colors.primary : Colors.textMuted} 
                      style={styles.readReceipt}
                    />
                  )}
                </View>

                {item.scamWarningTriggered && (
                  <View style={[styles.scamWarningCard, isMe ? styles.scamWarningMe : styles.scamWarningOther]}>
                    <View style={styles.scamWarningHeaderRow}>
                      <Ionicons name="warning" size={16} color="#EA4335" style={{ marginRight: 6 }} />
                      <Text style={styles.scamWarningTitle}>Safety Warning</Text>
                    </View>
                    <Text style={styles.scamWarningText}>
                      This message contains financial trigger keywords. Romance scams often involve requests for money, investment tips, or gift cards. Under no circumstances should you send funds.
                    </Text>
                    <View style={styles.scamWarningActionRow}>
                      <TouchableOpacity 
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Report User"
                        style={styles.scamWarningBtn} 
                        onPress={() => navigation.navigate('ReportUser', { profile })}
                      >
                        <Text style={styles.scamWarningBtnText}>Report User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Safety Center"
                        style={[styles.scamWarningBtn, { borderLeftWidth: 1, borderLeftColor: '#EA433520' }]} 
                        onPress={() => navigation.navigate('SafetyCenter')}
                      >
                        <Text style={[styles.scamWarningBtnText, { color: Colors.textMuted }]}>Safety Center</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListHeaderComponent={
            <View>
              {isTyping && (
                <View style={[styles.messageWrapper, styles.wrapperOther, { marginBottom: Spacing.sm }]}>
                  <View style={[styles.messageRow, styles.rowOther]}>
                    <Image source={{ uri: profile.photos?.[0] }} style={styles.bubbleAvatar} />
                    <View style={[styles.bubble, styles.bubbleOther, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }]}>
                      <Text style={[styles.bubbleText, styles.textOther, { fontStyle: 'italic', color: Colors.textMuted }]}>Typing...</Text>
                    </View>
                  </View>
                </View>
              )}
              {isUploading && (
                <View style={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={{ fontSize: 13, color: Colors.textMuted }}>Uploading image...</Text>
                </View>
              )}
            </View>
          }
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            if (!showScrollButton) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Scroll to bottom" style={styles.scrollBottomBtn} onPress={scrollToBottom}>
          <Ionicons name="chevron-down" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Women Message First Banner */}
      {matchRestriction.restrictedMode && !matchRestriction.firstMessageSent && (
        <View style={styles.wmfBanner}>
          <Ionicons 
            name={isInputBlocked ? "lock-closed" : "sparkles"} 
            size={14} 
            color={isInputBlocked ? Colors.textMuted : Colors.primary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.wmfBannerText, isInputBlocked && styles.wmfBannerTextMuted]}>
            {isInputBlocked
              ? `💛 You're matched! She can start the conversation when she's ready.`
              : `✨ You matched! Break the ice and start the conversation.`
            }
          </Text>
        </View>
      )}

      {/* Message Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : Spacing.md }]}>
        <View style={styles.inputContainer}>
          <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Attach image" style={styles.attachBtn} onPress={handleAttach} disabled={isInputBlocked}>
            <Ionicons name="add" size={28} color={isInputBlocked ? Colors.border : Colors.textMuted} />
          </TouchableOpacity>
          
          <View style={[styles.textInputWrapper, isInputBlocked && styles.textInputWrapperDisabled]}>
            <TextInput
              placeholder={isInputBlocked ? `Waiting for ${profile?.name || 'her'} to message first...` : 'Type a message...'}
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={handleTextChange}
              style={styles.textInputStyle}
              multiline
              maxLength={500}
              editable={!isInputBlocked}
            />
          </View>
          
          {!isInputBlocked && text.trim().length > 0 ? (
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Send message" onPress={handleSend} style={styles.sendButtonGlow}>
              <LinearGradient
                colors={Gradients.primary.colors}
                start={Gradients.primary.start}
                end={Gradients.primary.end}
                style={styles.sendButton}
              >
                <Ionicons name="arrow-up" size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.sendButtonDisabled}>
              <Ionicons name="arrow-up" size={20} color={Colors.white} />
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, backgroundColor: Colors.background, borderBottomWidth: 1, borderColor: Colors.border, zIndex: 10 },
  backBtn: { padding: Spacing.xs },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginLeft: Spacing.md },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  activeText: { fontSize: 11, color: Colors.textMuted },
  optionsIcon: { paddingHorizontal: Spacing.xs },
  messagesList: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  messageWrapper: { marginBottom: Spacing.lg, maxWidth: '80%' },
  wrapperMe: { alignSelf: 'flex-end' },
  wrapperOther: { alignSelf: 'flex-start' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: Spacing.sm, marginBottom: 2 },
  bubble: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  bubbleMe: { borderBottomRightRadius: 4, ...Shadow.sm },
  bubbleOther: { backgroundColor: Colors.bubbleReceived, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  textMe: { color: Colors.white, fontWeight: '500' },
  textOther: { color: Colors.text },
  timestamp: { fontSize: 10, color: Colors.textMuted },
  timestampRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timestampMe: { alignSelf: 'flex-end' },
  timestampOther: { alignSelf: 'flex-start', marginLeft: 36 },
  readReceipt: { marginLeft: 4 },
  inputBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderColor: Colors.border },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.sm },
  attachBtn: { padding: Spacing.xs },
  textInputWrapper: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius['2xl'], paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', minHeight: 40, maxHeight: 100 },
  textInputStyle: { fontSize: 15, color: Colors.text, padding: 0, margin: 0 },
  sendButtonGlow: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.border },
  
  skeletonContainer: { flex: 1, padding: Spacing.xl },
  skeletonBubble: { height: 40, borderRadius: Radius.lg, marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  skeletonMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  skeletonOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  scrollBottomBtn: { position: 'absolute', bottom: 80, right: Spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md, zIndex: 100 },
  bubbleImage: { width: 200, height: 200, borderRadius: Radius.md, resizeMode: 'cover' },
  
  icebreakerContainer: { paddingVertical: Spacing['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  icebreakerHeader: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4, textAlign: 'center' },
  icebreakerSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xl, textAlign: 'center' },
  icebreakerList: { width: '100%', gap: 12 },
  icebreakerCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  icebreakerText: { fontSize: 14, color: Colors.text, fontWeight: '600', textAlign: 'center' },

  // Safety warning banner
  scamWarningCard: {
    backgroundColor: '#FAF5F5',
    borderWidth: 1,
    borderColor: '#EA433530',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    width: '100%',
    ...Shadow.sm
  },
  scamWarningMe: {
    alignSelf: 'flex-end',
  },
  scamWarningOther: {
    alignSelf: 'flex-start',
    marginLeft: 36,
  },
  scamWarningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scamWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA4335',
  },
  scamWarningText: {
    fontSize: 12,
    color: '#5A6065',
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  scamWarningActionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EA433515',
    paddingTop: Spacing.xs,
    justifyContent: 'space-around',
  },
  scamWarningBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  scamWarningBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA4335',
  },

  // Women Message First
  wmfBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border },
  wmfBannerText: { fontSize: 12, fontWeight: '700', color: Colors.primary, flex: 1 },
  wmfBannerTextMuted: { color: Colors.textMuted, fontWeight: '600' },
  textInputWrapperDisabled: { opacity: 0.45 },
});
