import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getBlockedUsers, blockUser, unblockUser } from '../../services/UserService';

export default function BlockedContactsScreen({ navigation }) {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [blockedList, setBlockedList] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBlocked = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const list = await getBlockedUsers(user.uid);
      setBlockedList(list);
    } catch (e) {
      console.warn('Failed to load blocked users:', e);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBlocked();
      setLoading(false);
    })();
  }, [fetchBlocked]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlocked();
    setRefreshing(false);
  };

  const handleBlockNumber = async () => {
    const trimmed = newEntry.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a user ID, phone, or name to block.');
      return;
    }

    setSubmitting(true);
    try {
      // For manual entries, we treat the input as a userId if it looks like a UUID
      const isUuid = /^[0-9a-f-]{36}$/i.test(trimmed);
      if (isUuid) {
        const success = await blockUser(user.uid, trimmed);
        if (success) {
          setNewEntry('');
          Alert.alert('Blocked', 'User has been blocked successfully.');
          await fetchBlocked();
        } else {
          Alert.alert('Error', 'Could not block this user. Please check the ID and try again.');
        }
      } else {
        Alert.alert(
          'User ID Required',
          'To block a specific user, please enter their exact User ID (UUID format). You can find it from their profile.',
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to block. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = (item) => {
    Alert.alert(
      'Unblock User?',
      `This will allow ${item.name} to appear in your discovery feed again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await unblockUser(user.uid, item.id);
              if (success) {
                setBlockedList(prev => prev.filter(u => u.id !== item.id));
                Alert.alert('Unblocked', `${item.name} has been unblocked.`);
              } else {
                Alert.alert('Error', 'Could not unblock. Please try again.');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to unblock. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessible={true} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Block by User ID input */}
      <View style={styles.inputArea}>
        <View style={styles.inputWrap}>
          <Ionicons name="ban-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter User ID to block..."
            placeholderTextColor={Colors.textMuted}
            value={newEntry}
            onChangeText={setNewEntry}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.blockBtn, submitting && { opacity: 0.6 }]}
          onPress={handleBlockNumber}
          disabled={submitting}
          accessible={true} accessibilityLabel="Block User" accessibilityRole="button"
        >
          {submitting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.blockBtnText}>Block</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Info note */}
      <View style={styles.noteRow}>
        <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} />
        <Text style={styles.noteText}>
          Blocked users can't see your profile, match with you, or message you.
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : blockedList.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={52} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptySub}>
            When you block someone, they'll appear here. You can unblock them at any time.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedList}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>{blockedList.length} blocked {blockedList.length === 1 ? 'person' : 'people'}</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name || 'Unknown User'}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>{item.phone || item.id}</Text>
              </View>
              <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item)} accessible={true} accessibilityLabel={`Unblock ${item.name || 'Unknown User'}`} accessibilityRole="button">
                <Text style={styles.unblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, height: 60,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border,
    ...Shadow.sm
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },

  inputArea: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm,
  },
  inputIcon: { marginRight: Spacing.xs },
  input: { flex: 1, height: 44, color: Colors.text, fontSize: 14 },
  blockBtn: {
    backgroundColor: Colors.error, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.lg, height: 44,
  },
  blockBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface + 'AA',
  },
  noteText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },

  listContent: { padding: Spacing.xl },
  listHeader: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md },

  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  itemSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  unblockBtn: {
    paddingVertical: 7, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  unblockText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
