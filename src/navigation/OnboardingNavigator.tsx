import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PhoneEmailScreen from '../screens/onboarding/PhoneEmailScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import PasswordScreen from '../screens/onboarding/PasswordScreen';
import BasicInfoScreen from '../screens/onboarding/BasicInfoScreen';
import PreferencesScreen from '../screens/onboarding/PreferencesScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import LocationPermissionScreen from '../screens/onboarding/LocationPermissionScreen';
import PhotoUploadScreen from '../screens/onboarding/PhotoUploadScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator({ initialRouteName = 'Splash' }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneEmail" component={PhoneEmailScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Password" component={PasswordScreen} />
      <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
    </Stack.Navigator>
  );
}
