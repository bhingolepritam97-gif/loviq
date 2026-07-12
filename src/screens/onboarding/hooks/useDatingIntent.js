import { useState } from 'react';

let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Graceful fallback if expo-haptics is not available
}

export function useDatingIntent(route, navigation) {
  const { name, birthday, age, gender, showGender } = route.params || {
    name: 'User',
    birthday: '',
    age: 18,
    gender: '',
    showGender: true,
  };

  const [selectedIntent, setSelectedIntent] = useState('');

  const triggerHaptic = () => {
    if (Haptics && Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
        intent: selectedIntent,
      });
    }
  };

  const selectedCount = selectedIntent ? 1 : 0;
  const percentComplete = selectedIntent ? 33 : 0;
  const remainingCount = selectedIntent ? 2 : 3;

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
