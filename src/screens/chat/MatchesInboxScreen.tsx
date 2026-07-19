import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Gradients, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMatches } from '../../services/ChatService';
import { Ionicons } from '@expo/vector-icons';
import BrandIcon from '../../components/brand/BrandIcon';
import BrandLogo from '../../components/brand/BrandLogo';
import { Brand } from '../../components/brand/brand';
import { Skeleton } from '../../components/Skeleton';

// Format countdown from deadline timestamp
function formatCountdown(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h left`;
  return `${mins}m left`;
}

export default function MatchesInboxScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};

    const setupSubscription = () => {
      if (!user) {
        setMatches([]);
        setLoading(false);
        return;
      }
      
      if (!refreshing) {
        setLoading(true);
      }
      unsubscribe = subscribeToMatches((fetchedMatches) => {
        setMatches(fetchedMatches);
        setLoading(false);
        setRefreshing(false);
      });
    };

    setupSubscription();

    return () => {
      unsubscribe();
    };
  }, [user, refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  };

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
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="See all new matches" onPress={() => navigation.navigate('NewMatchCarousel')}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
        {newMatches.map((match) => (
          <TouchableOpacity 
            key={match.id} 
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${match.otherUser?.name || 'User'}`}
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
                  <Image 
                    source={{ uri: match.otherUser.photos[0] }} 
                    style={styles.matchAvatar} 
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.matchAvatar, { backgroundColor: Colors.border }]} />
                )}
              </View>
            </LinearGradient>
            
            {/* Online status indicator dot */}
            {match.otherUser?.isOnline && (
              <View style={styles.onlineBadge} />
            )}

            {/* Women Message First countdown/waiting badge */}
            {match.restrictedMode && !match.firstMessageSent && match.messageDeadline && (
              match.onlyUserIdCanMessageFirst === profile?.id ? (
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownText}>⏳ {formatCountdown(match.messageDeadline)}</Text>
                </View>
              ) : (
                <View style={[styles.countdownBadge, styles.waitingBadge]}>
                  <Text style={[styles.countdownText, styles.waitingText]}>Waiting...</Text>
                </View>
              )
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
        <TouchableOpacity 
          accessible={true} 
          accessibilityRole="button" 
          accessibilityLabel="Menu options" 
          style={styles.headerIconButton}
        >
          <Ionicons name="menu-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitleSerif}>Messages</Text>

        <TouchableOpacity 
          accessible={true} 
          accessibilityRole="button" 
          accessibilityLabel="Special picks" 
          style={styles.headerIconButton}
        >
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
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
            <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Inbox */}
      {loading ? (
        <View style={{ flex: 1 }}>
          <View style={{ padding: Spacing.lg }}>
            <Skeleton width="40%" height={20} borderRadius={Radius.sm} style={{ marginBottom: Spacing.md }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xl }}>
               {[1, 2, 3, 4].map((i) => (
                 <View key={i} style={{ marginRight: Spacing.md, alignItems: 'center' }}>
                   <Skeleton width={70} height={70} borderRadius={35} style={{ marginBottom: Spacing.xs }} />
                   <Skeleton width={50} height={12} borderRadius={Radius.sm} />
                 </View>
               ))}
            </ScrollView>
            <Skeleton width="30%" height={20} borderRadius={Radius.sm} style={{ marginBottom: Spacing.md }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
                 <Skeleton width={60} height={60} borderRadius={30} style={{ marginRight: Spacing.md }} />
                 <View style={{ flex: 1 }}>
                   <Skeleton width="50%" height={16} borderRadius={Radius.sm} style={{ marginBottom: Spacing.xs }} />
                   <Skeleton width="80%" height={14} borderRadius={Radius.sm} />
                 </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderNewMatches}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          getItemLayout={(data, index) => ({
            length: 89,
            offset: 89 * index,
            index,
          })}
          renderItem={({ item }) => {
            const isUnread = item.read === false;
            return (
              <TouchableOpacity 
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${item.otherUser?.name || 'User'}`}
                style={[styles.chatRow, isUnread && styles.unreadChatRow]}
                onPress={() => navigation.navigate('Chat', { matchId: item.id, profile: item.otherUser })}
                activeOpacity={0.7}
              >
                <View style={styles.chatAvatarWrap}>
                  {item.otherUser?.photos?.[0] ? (
                    <Image 
                      source={{ uri: item.otherUser.photos[0] }} 
                      style={styles.chatAvatar} 
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
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
                <BrandLogo size="lg" style={{ opacity: 0.15, marginBottom: Spacing.xl }} />
                <Text style={styles.emptySearchTitle}>It's quiet here...</Text>
                <Text style={styles.emptySearchSubtitle}>Keep swiping! When you match with someone, they'll appear here.</Text>
                <TouchableOpacity 
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Keep Discovering"
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

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    height: 60, 
    borderBottomWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.background 
  },
  headerIconButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitleSerif: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Typography.fontFamily.serif,
  },
 
  searchSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.background },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.surface, 
    borderRadius: Radius['2xl'], 
    paddingHorizontal: Spacing.md, 
    height: 44, 
    borderWidth: 1, 
    borderColor: Colors.border,
    ...Shadow.sm
  },
  searchIcon: { fontSize: 14, marginRight: Spacing.xs, color: Colors.textMuted },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 0, fontFamily: Typography.fontFamily.sansSerif },
  clearSearchBtn: { padding: Spacing.xs },
  clearSearchText: { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
 
  newMatchesSection: { marginVertical: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: Typography.fontFamily.sansSerif },
  seeAll: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontWeight: '700', fontFamily: Typography.fontFamily.sansSerif },
  matchesScroll: { paddingLeft: Spacing.xl, flexDirection: 'row' },
  matchItem: { alignItems: 'center', marginRight: Spacing.lg, position: 'relative' },
  
  // Glowing pink border rings around active stories
  unreadRing: { 
    width: 74, 
    height: 74, 
    borderRadius: 37, 
    padding: 3, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#E8628F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInner: { flex: 1, width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', borderWidth: 3, borderColor: Colors.background },
  matchAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  onlineBadge: { position: 'absolute', bottom: 18, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.success, borderWidth: 2.5, borderColor: Colors.background },
  matchName: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: Spacing.sm, fontFamily: Typography.fontFamily.sansSerif },

  countdownBadge: { position: 'absolute', bottom: 22, left: -4, right: -4, backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 2, alignItems: 'center' },
  countdownText: { fontSize: 9, fontWeight: '800', color: Colors.white },
  waitingBadge: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  waitingText: { color: Colors.textMuted },
 
  listScroll: { paddingBottom: 100 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  unreadChatRow: { backgroundColor: 'rgba(232, 98, 143, 0.04)' },
  chatAvatarWrap: { position: 'relative', width: 56, height: 56 },
  chatAvatar: { width: 56, height: 56, borderRadius: 28, resizeMode: 'cover', backgroundColor: Colors.border },
  chatOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2.2, borderColor: Colors.background },
  chatDetails: { flex: 1, marginLeft: Spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  
  // Serif font for conversation names
  chatName: { fontSize: 17, fontWeight: '700', color: Colors.text, fontFamily: Typography.fontFamily.serif, letterSpacing: -0.2 },
  unreadText: { color: Colors.text, fontWeight: '800' },
  chatTime: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', fontFamily: Typography.fontFamily.sansSerif },
  chatPreview: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, fontFamily: Typography.fontFamily.sansSerif },
  unreadPreview: { color: Colors.text, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: Spacing.md },
 
  emptySearchContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'], paddingTop: 80 },
  emptySearchEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptySearchTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, fontFamily: Typography.fontFamily.serif },
  emptySearchSubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, fontFamily: Typography.fontFamily.sansSerif },
  exploreBtn: { marginTop: Spacing.xl, borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.sm },
  exploreGradient: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  exploreBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
