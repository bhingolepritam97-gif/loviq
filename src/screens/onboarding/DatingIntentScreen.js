import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import styles from './styles/datingIntent.styles';
import useDatingIntent from './hooks/useDatingIntent';
import OnboardingHeader from '../../components/OnboardingHeader';
import IntentCard from './components/IntentCard';
import StickyFooter from './components/StickyFooter';

const INTENTS = [
  {
    id: 'long_term',
    title: 'Long-term partner',
    description: "Looking for someone to build a future with and share life's big moments.",
    emoji: '❤️',
  },
  {
    id: 'casual',
    title: 'Something casual',
    description: 'Keeping things light and fun. Open to new connections without the pressure.',
    emoji: '🔥',
  },
  {
    id: 'figuring_out',
    title: 'Still figuring it out',
    description: 'Not in a rush. Wanting to meet new people and see where things go naturally.',
    emoji: '❓',
  },
];

export default function DatingIntentScreen({ route, navigation }) {
  const {
    selectedIntent,
    handleSelect,
    handleContinue,
    selectedCount,
    percentComplete,
    remainingCount,
  } = useDatingIntent(route, navigation);

  const canContinue = selectedIntent !== '';

  return (
    <View style={styles.container}>
      {/* Premium Segmented Progress Header */}
      <OnboardingHeader
        onBack={() => navigation.goBack()}
        currentStep={8}
        totalSteps={12}
        title="Build Profile"
        subtitle="Step 3 of 6"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.header}>
          <Text style={styles.title}>What are you looking for?</Text>
          <Text style={styles.subtitle}>
            Be clear about your intentions to find people with similar vibes.
          </Text>
        </View>

        {/* Premium Cards List */}
        <View style={styles.intentsList}>
          {INTENTS.map((intent) => (
            <IntentCard
              key={intent.id}
              id={intent.id}
              title={intent.title}
              description={intent.description}
              emoji={intent.emoji}
              isSelected={selectedIntent === intent.id}
              onPress={() => handleSelect(intent.id)}
            />
          ))}
        </View>

        {/* Premium Quote Section */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteSparkle}>✦</Text>
          <Text style={styles.quoteText}>"Honesty is the highest form of intimacy."</Text>
          <Text style={styles.quoteSparkle}>✦</Text>
        </View>
      </ScrollView>

      {/* Premium Sticky Footer */}
      <StickyFooter
        selectedCount={selectedCount}
        percentComplete={percentComplete}
        remainingCount={remainingCount}
        isEnabled={canContinue}
        onPress={handleContinue}
      />
    </View>
  );
}
