import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Gradients, Shadow } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMatches } from '../../services/ChatService';
import { Ionicons } from '@expo/vector-icons';

export default function MatchesInboxScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};

    const setupSubscription = () => {
      if (!user) {
        setMatches([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      unsubscribe = subscribeToMatches((fetchedMatches) => {
        setMatches(fetchedMatches);
        setLoading(false);
      });
    };

    setupSubscription();

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Filter matches into New Matches (unstarted conversations) and Active Chats
  const newMatches = matches.filter(m => !m.lastMessage);
  
  const activeChats = matches
    .filter(m => m.lastMessage)
    .sort((a, b) => {
      if (a.read === b.read) {
        const timeA = a.lastMessageTime?.getTime ? a.lastMessageTime.getTime() : a.lastMessageTime;
        const timeB = b.lastMessageTime?.getTime ? b.lastMessageTime.getTime() : b.lastMessageTime;
        return timeB - timeA;
      }
      return a.read ? 1 : -1; // Unread (read=false) comes first
    });

  // Filter active chats by query
  const filteredChats = activeChats.filter(chat =>
    chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNewMatches = () => (
    <View style={styles.newMatchesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>New Matches</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewMatchCarousel')}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
        {newMatches.map((match) => (
          <TouchableOpacity 
            key={match.id} 
            style={styles.matchItem}
            onPress={() => navigation.navigate('Chat', { matchId: match.id, profile: match.otherUser })}
            activeOpacity={0.8}
          >
            {/* Unread gradient ring wrapper */}
            <LinearGradient
              colors={Gradients.primary.colors}
              start={Gradients.primary.start}
              end={Gradients.primary.end}
              style={styles.unreadRing}
            >
              <View style={styles.avatarInner}>
                {match.otherUser?.photos?.[0] ? (
                  <Image source={{ uri: match.otherUser.photos[0] }} style={styles.matchAvatar} />
                ) : (
                  <View style={[styles.matchAvatar, { backgroundColor: Colors.border }]} />
                )}
              </View>
            </LinearGradient>
            
            {/* Online status indicator dot */}
            {match.otherUser?.isOnline && (
              <View style={styles.onlineBadge} />
            )}
            <Text style={styles.matchName}>{match.otherUser?.name || 'User'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.userAvatarWrap}>
            {profile?.photos?.[0] ? (
              <Image source={{ uri: profile.photos[0] }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: Colors.border }]} />
            )}
          </TouchableOpacity>
          <Text style={styles.title}>Matches</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search matches by name..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Inbox */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderNewMatches}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isUnread = item.read === false;
            return (
              <TouchableOpacity 
                style={[styles.chatRow, isUnread && styles.unreadChatRow]}
                onPress={() => navigation.navigate('Chat', { matchId: item.id, profile: item.otherUser })}
                activeOpacity={0.7}
              >
                <View style={styles.chatAvatarWrap}>
                  {item.otherUser?.photos?.[0] ? (
                    <Image source={{ uri: item.otherUser.photos[0] }} style={styles.chatAvatar} />
                  ) : (
                    <View style={styles.chatAvatar} />
                  )}
                  {item.otherUser?.isOnline && (
                    <View style={styles.chatOnlineDot} />
                  )}
                </View>
                
                <View style={styles.chatDetails}>
                  <View style={styles.rowHeader}>
                    <Text style={[styles.chatName, isUnread && styles.unreadText]}>{item.otherUser?.name || 'User'}</Text>
                    <Text style={styles.chatTime}>
                      {item.lastMessageTime ? new Date(item.lastMessageTime?.toDate ? item.lastMessageTime.toDate() : item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  {item.typing?.[item.otherUser?.id] ? (
                    <Text 
                      style={[styles.chatPreview, { color: Colors.primary, fontWeight: '700', fontStyle: 'italic' }]}
                      numberOfLines={1}
                    >
                      Typing...
                    </Text>
                  ) : (
                    <Text 
                      style={[styles.chatPreview, isUnread && styles.unreadPreview]}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                  )}
                </View>

                {isUnread && (
                  <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listScroll}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchEmoji}>🔍</Text>
                <Text style={styles.emptySearchTitle}>No matches found</Text>
                <Text style={styles.emptySearchSubtitle}>We couldn't find any chats matching "{searchQuery}".</Text>
              </View>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={Colors.border} />
                <Text style={styles.emptySearchTitle}>It's quiet here...</Text>
                <Text style={styles.emptySearchSubtitle}>Keep swiping! When you match with someone, they'll appear here.</Text>
                <TouchableOpacity 
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate('Discover')}
                >
                  <LinearGradient
                    colors={Gradients.primary.colors}
                    start={Gradients.primary.start}
                    end={Gradients.primary.end}
                    style={styles.exploreGradient}
                  >
                    <Text style={styles.exploreBtnText}>Keep Discovering</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userAvatarWrap: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.primary + '30', ...Shadow.sm },
  userAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  icon: { fontSize: 16 },

  searchSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 40, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 14, marginRight: Spacing.xs, color: Colors.textMuted },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 0 },
  clearSearchBtn: { padding: Spacing.xs },
  clearSearchText: { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },

  newMatchesSection: { marginVertical: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.0, textTransform: 'uppercase' },
  seeAll: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontWeight: '700' },
  matchesScroll: { paddingLeft: Spacing.xl, flexDirection: 'row' },
  matchItem: { alignItems: 'center', marginRight: Spacing.lg, position: 'relative' },
  unreadRing: { width: 74, height: 74, borderRadius: 37, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { flex: 1, width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', borderWidth: 3, borderColor: Colors.surface },
  matchAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  onlineBadge: { position: 'absolute', bottom: 20, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.success, borderWidth: 2.5, borderColor: Colors.surface },
  matchName: { fontSize: 12, fontWeight: '700', color: Colors.text, marginTop: Spacing.sm },

  listScroll: { paddingBottom: 100 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  unreadChatRow: { backgroundColor: Colors.primary + '04' },
  chatAvatarWrap: { position: 'relative', width: 56, height: 56 },
  chatAvatar: { width: 56, height: 56, borderRadius: 28, resizeMode: 'cover', backgroundColor: Colors.border },
  chatOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2.2, borderColor: Colors.surface },
  chatDetails: { flex: 1, marginLeft: Spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  chatName: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  unreadText: { color: Colors.text, fontWeight: '800' },
  chatTime: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  chatPreview: { fontSize: 14, color: Colors.textMuted, lineHeight: 18 },
  unreadPreview: { color: Colors.text, fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginLeft: Spacing.md },

  emptySearchContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'], paddingTop: 80 },
  emptySearchEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptySearchTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySearchSubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  exploreBtn: { marginTop: Spacing.xl, borderRadius: Radius.full, overflow: 'hidden', ...Shadow.sm },
  exploreGradient: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  exploreBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
