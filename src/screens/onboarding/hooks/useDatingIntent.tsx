import { useState } from 'react';

let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Graceful fallback if expo-haptics is not available
}

export function useDatingIntent(route, navigation) {
  const { name, birthday, age, gender, showGender, interestedIn = [] } = route.params || {
    name: 'User',
    birthday: '',
    age: 18,
    gender: '',
    showGender: true,
    interestedIn: [],
  };

  const [selectedIntent, setSelectedIntent] = useState('');

  const triggerHaptic = () => {
    if (Haptics && Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((err) => console.log('Haptics error:', err));
    }
  };

  const handleSelect = (id) => {
    setSelectedIntent(id);
    triggerHaptic();
  };

  const handleContinue = () => {
    if (selectedIntent) {
      navigation.navigate('Interests', {
        name,
        birthday,
        age,
        gender,
        showGender,
        interestedIn,
        intent: selectedIntent,
      });
    }
  };

  const selectedCount = selectedIntent ? 1 : 0;
  const percentComplete = selectedIntent ? 100 : 0;
  const remainingCount = selectedIntent ? 0 : 1;

  return {
    selectedIntent,
    handleSelect,
    handleContinue,
    selectedCount,
    percentComplete,
    remainingCount,
    routeParams: { name, birthday, age, gender, showGender },
  };
}
export default useDatingIntent;
