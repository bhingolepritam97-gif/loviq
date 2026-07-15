import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow, Gradients } from '../../theme';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchMatchMessages, sendMessage, subscribeToMessages, updateTypingStatus, markMessagesAsRead } from '../../services/ChatService';
import { socketService } from '../../api/socket';

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { matchId } = route.params || {};
  const [profile, setProfile] = useState(route.params?.profile || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!matchId) return;

    let unsubscribe = () => {};

    const loadData = async () => {
      // If profile is missing (e.g. from a push notification deep link), fetch it
      if (!profile) {
        const { fetchMatch } = require('../../services/ChatService');
        const matchData = await fetchMatch(matchId);
        if (matchData && matchData.otherUser) {
          setProfile(matchData.otherUser);
        }
      }

      // Initial fetch isn't strictly necessary with onSnapshot, but we keep it to populate quickly
      const fetched = await fetchMatchMessages(matchId);
      setMessages(fetched);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Subscribe to real-time updates via Firestore
      unsubscribe = subscribeToMessages(matchId, (newMessages) => {
        setMessages(newMessages);
        if (user) markMessagesAsRead(matchId, user.uid);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });
    };

    loadData();
    
    // Subscribe to typing status events via WebSocket
    const socket = socketService.getSocket();
    const handleTypingEvent = ({ senderId, isTyping }) => {
      if (profile && senderId === profile.id) {
        setIsTyping(isTyping);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };
    if (socket) {
      socket.on("typing", handleTypingEvent);
    }

    return () => {
      unsubscribe();
      if (socket) {
        socket.off("typing", handleTypingEvent);
      }
    };
  }, [matchId, profile]);

  const HARASSMENT_BLACKLIST = ['idiot', 'stupid', 'ugly', 'die', 'kill', 'bitch'];

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
    updateTypingStatus(matchId, user.uid, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    try {
      await sendMessage(matchId, user.uid, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setText(messageText);
      Alert.alert('Send Failed ⚠️', 'Unable to send message. Please check your internet connection and try again.');
    }
  };

  const handleTextChange = (newText) => {
    setText(newText);
    if (!user) return;
    
    updateTypingStatus(matchId, user.uid, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(matchId, user.uid, false);
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
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Show button if we are more than 150px away from the bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 150;
    setShowScrollButton(!isCloseToBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
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
          <TouchableOpacity onPress={() => handleCallPress('audio')}>
            <Ionicons name="call" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCallPress('video')}>
            <Ionicons name="videocam" size={26} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openSafetyCenter} style={{ marginLeft: Spacing.xs }}>
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
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.uid;
            return (
              <View style={[styles.messageWrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
                <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
                  {!isMe && (
                    <Image source={{ uri: profile.photos?.[0] }} style={styles.bubbleAvatar} />
                  )}
                  
                  {isMe ? (
                    <LinearGradient
                      colors={Gradients.primary.colors}
                      start={Gradients.primary.start}
                      end={Gradients.primary.end}
                      style={[styles.bubble, styles.bubbleMe]}
                    >
                      <Text style={[styles.bubbleText, styles.textMe]}>{item.text}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.bubble, styles.bubbleOther]}>
                      <Text style={[styles.bubbleText, styles.textOther]}>{item.text}</Text>
                    </View>
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
              </View>
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageWrapper, styles.wrapperOther, { marginBottom: Spacing.sm }]}>
                <View style={[styles.messageRow, styles.rowOther]}>
                  <Image source={{ uri: profile.photos?.[0] }} style={styles.bubbleAvatar} />
                  <View style={[styles.bubble, styles.bubbleOther, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }]}>
                    <Text style={[styles.bubbleText, styles.textOther, { fontStyle: 'italic', color: Colors.textMuted }]}>Typing...</Text>
                  </View>
                </View>
              </View>
            ) : null
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
        <TouchableOpacity style={styles.scrollBottomBtn} onPress={scrollToBottom}>
          <Ionicons name="chevron-down" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Message Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : Spacing.md }]}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={28} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <View style={styles.textInputWrapper}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={handleTextChange}
              style={styles.textInputStyle}
              multiline
              maxLength={500}
            />
          </View>
          
          {text.trim().length > 0 ? (
            <TouchableOpacity onPress={handleSend} style={styles.sendButtonGlow}>
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

const styles = StyleSheet.create({
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
  bubbleMe: { borderBottomRightRadius: Radius.xs, ...Shadow.sm },
  bubbleOther: { backgroundColor: Colors.bubbleReceived, borderBottomLeftRadius: Radius.xs },
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
  skeletonMe: { alignSelf: 'flex-end', borderBottomRightRadius: Radius.xs },
  skeletonOther: { alignSelf: 'flex-start', borderBottomLeftRadius: Radius.xs },
  scrollBottomBtn: { position: 'absolute', bottom: 80, right: Spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md, zIndex: 100 },
});
