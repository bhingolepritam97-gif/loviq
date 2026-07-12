import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';


const { width } = Dimensions.get('window');

export default function NewMatchCarouselScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const newMatches = route.params?.newMatches || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Matches</Text>
        <View style={{ width: 36 }} />
      </View>

      {newMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🤫</Text>
          <Text style={styles.emptyTitle}>No new matches</Text>
          <Text style={styles.emptySubtitle}>Keep swiping on the Discover tab to find matches!</Text>
        </View>
      ) : (
        <FlatList
          data={newMatches}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('Chat', { matchId: item.id, profile: item.profile })}
            >
              <Image source={{ uri: item.profile.photos[0] }} style={styles.photo} />
              <View style={styles.scrim} />
              <Text style={styles.name}>{item.profile.name}, {item.profile.age}</Text>
            </TouchableOpacity>
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, height: 60, borderBottomWidth: 1, borderColor: Colors.border },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.text },
  list: { padding: Spacing.md, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: Spacing.md },
  card: { width: (width - Spacing.md * 3) / 2, aspectRatio: 0.8, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative', ...Shadow.sm },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  name: { position: 'absolute', bottom: 12, left: 12, color: Colors.white, fontSize: 16, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 72, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
