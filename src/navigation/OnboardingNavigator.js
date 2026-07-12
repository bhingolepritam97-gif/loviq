import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PhoneEmailScreen from '../screens/onboarding/PhoneEmailScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import PasswordScreen from '../screens/onboarding/PasswordScreen';
import NameScreen from '../screens/onboarding/NameScreen';
import BirthdayScreen from '../screens/onboarding/BirthdayScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import InterestedInScreen from '../screens/onboarding/InterestedInScreen';
import DatingIntentScreen from '../screens/onboarding/DatingIntentScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import BioScreen from '../screens/onboarding/BioScreen';
import PhotoUploadScreen from '../screens/onboarding/PhotoUploadScreen';
import LocationPermissionScreen from '../screens/onboarding/LocationPermissionScreen';
import NotificationPermissionScreen from '../screens/onboarding/NotificationPermissionScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator({ initialRouteName = 'Splash' }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneEmail" component={PhoneEmailScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Password" component={PasswordScreen} />
      <Stack.Screen name="Name" component={NameScreen} />
      <Stack.Screen name="Birthday" component={BirthdayScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="InterestedIn" component={InterestedInScreen} />
      <Stack.Screen name="DatingIntent" component={DatingIntentScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="Bio" component={BioScreen} />
      <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
    </Stack.Navigator>
  );
}
