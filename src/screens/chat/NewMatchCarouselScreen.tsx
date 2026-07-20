import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResponsiveContainer } from '../../core/responsive';
import { Typography, Spacing, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';


export default function NewMatchCarouselScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors, width);
  const insets = useSafeAreaInsets();
  const newMatches = route.params?.newMatches || [];

  return (
    <ResponsiveContainer safeArea={false}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity accessible={true} accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${item.profile.name}`}
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
    </ResponsiveContainer>
  );
}

const createStyles = (Colors, width) => StyleSheet.create({
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
