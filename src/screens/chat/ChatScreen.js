import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchMatchMessages, sendMessage } from '../../services/ChatService';

import { socketService } from '../../api/socket';

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { matchId } = route.params || {};
  const [profile, setProfile] = useState(route.params?.profile || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatListRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!matchId) return;

    let socket;
    const loadData = async () => {
      // If profile is missing (e.g. from a push notification deep link), fetch it
      if (!profile) {
        const { fetchMatch } = require('../../services/ChatService');
        const matchData = await fetchMatch(matchId);
        if (matchData && matchData.otherUser) {
          setProfile(matchData.otherUser);
        }
      }

      const fetched = await fetchMatchMessages(matchId);
      setMessages(fetched);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      socket = await socketService.connect();
      socket.emit('join_match', matchId);

      socket.on('new_message', (message) => {
        // Only append if it belongs to this match
        if (message.matchId === matchId) {
          const formattedMessage = {
            id: message.id,
            senderId: message.senderId,
            text: message.content,
            timestamp: message.createdAt,
            read: message.read
          };
          setMessages(prev => [...prev, formattedMessage]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      });
    };

    loadData();

    return () => {
      if (socket) {
        socket.off('new_message');
        // We could emit a leave_match event here if desired, 
        // but socket.io cleans up on disconnect or we can just ignore.
      }
    };
  }, [matchId]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const messageText = text;
    setText('');
    try {
      await sendMessage(matchId, user.uid, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

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
            const { blockUser } = require('../../services/UserService');
            const success = await blockUser(user?.uid, profile.id);
            if (success) {
              Alert.alert('User blocked');
              navigation.navigate('Inbox'); // Go back to inbox after block
            } else {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      `Report ${profile.name}`,
      `Please provide a reason for reporting this user (e.g., Spam, Harassment).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: async (reason) => {
            if (!reason) return;
            const { reportUser, blockUser } = require('../../services/UserService');
            const success = await reportUser(user?.uid, profile.id, reason);
            if (success) {
              await blockUser(user?.uid, profile.id);
              Alert.alert('Report submitted', 'User has been blocked.');
              navigation.navigate('Inbox');
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
    const { ActionSheetIOS, Alert, Platform } = require('react-native');
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

  if (!profile) return null;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileMeta} 
          onPress={() => navigation.navigate('DiscoverFlow', { screen: 'ProfileDetail', params: { profile } })}
        >
          <Avatar uri={profile.photos[0]} name={profile.name} size={40} showOnline={profile.isOnline} />
          <View>
            <Text style={styles.headerName}>{profile.name}</Text>
            <Text style={styles.activeText}>{profile.isOnline ? 'Active Now' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={showSafetyMenu}>
          <Text style={styles.optionsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.uid;
          return (
            <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
              {!isMe && (
                <Image source={{ uri: profile.photos[0] }} style={styles.bubbleAvatar} />
              )}
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textOther]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + Spacing.sm : Spacing.md }]}>
        <View style={styles.inputContainer}>
          <Input
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            style={styles.textInputStyle}
            rightIcon={
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: Spacing.xs },
  backText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginLeft: Spacing.md },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  activeText: { fontSize: 11, color: Colors.textMuted },
  optionsIcon: { fontSize: 22, color: Colors.text, paddingHorizontal: Spacing.xs },
  messagesList: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  messageRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end', maxWidth: '80%' },
  rowMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  rowOther: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: Spacing.sm, marginBottom: 2 },
  bubble: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: Radius.xs },
  bubbleOther: { backgroundColor: Colors.bubbleReceived, borderBottomLeftRadius: Radius.xs },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  textMe: { color: Colors.white },
  textOther: { color: Colors.text },
  inputBar: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  textInputStyle: { flex: 1 },
  sendButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  sendText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
