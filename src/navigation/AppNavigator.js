import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';

import FiltersScreen from '../screens/browsing/FiltersScreen';
import ProfileDetailScreen from '../screens/browsing/ProfileDetailScreen';
import MatchScreen from '../screens/browsing/MatchScreen';
import EmptyStateScreen from '../screens/browsing/EmptyStateScreen';
import SuperLikeScreen from '../screens/browsing/SuperLikeScreen';
import RewindScreen from '../screens/browsing/RewindScreen';

import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import PreferencesScreen from '../screens/profile/PreferencesScreen';
import PremiumScreen from '../screens/profile/PremiumScreen';
import ManagePhotosScreen from '../screens/profile/ManagePhotosScreen';
import ManagePromptsScreen from '../screens/profile/ManagePromptsScreen';

import ChatScreen from '../screens/chat/ChatScreen';
import NewMatchCarouselScreen from '../screens/chat/NewMatchCarouselScreen';
import ChatOptionsScreen from '../screens/chat/ChatOptionsScreen';

import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// expo-notifications is intentionally disabled until google-services.json is configured.
// import * as Notifications from 'expo-notifications';

const RootStack = createStackNavigator();
const navigationRef = React.createRef();

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();

  // Push notification deep-link listener — re-enable once google-services.json is added.
  // React.useEffect(() => {
  //   const subscription = Notifications.addNotificationResponseReceivedListener(response => {
  //     const data = response.notification.request.content.data;
  //     if (data && data.matchId && user) {
  //       navigationRef.current?.navigate('Chat', { matchId: data.matchId });
  //     }
  //   });
  //   return () => subscription.remove();
  // }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF3A5C" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Unauthenticated Flow
          <RootStack.Screen name="Onboarding">
            {(props) => <OnboardingNavigator {...props} initialRouteName="Splash" />}
          </RootStack.Screen>
        ) : !profile?.profileComplete ? (
          // Authenticated but profile incomplete
          <RootStack.Screen name="Onboarding">
            {(props) => <OnboardingNavigator {...props} initialRouteName="Name" />}
          </RootStack.Screen>
        ) : (
          // Authenticated and complete profile
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            
            {/* Browsing Modals / Stack screens */}
            <RootStack.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
            <RootStack.Screen name="Match" component={MatchScreen} options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }} />
            <RootStack.Screen name="EmptyState" component={EmptyStateScreen} />
            <RootStack.Screen name="SuperLike" component={SuperLikeScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="Rewind" component={RewindScreen} options={{ presentation: 'modal' }} />

            {/* Profile Stack screens */}
            <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen name="Preferences" component={PreferencesScreen} />
            <RootStack.Screen name="Premium" component={PremiumScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="ManagePhotos" component={ManagePhotosScreen} />
            <RootStack.Screen name="ManagePrompts" component={ManagePromptsScreen} />

            {/* Chat Stack screens */}
            <RootStack.Screen name="Chat" component={ChatScreen} />
            <RootStack.Screen name="NewMatchCarousel" component={NewMatchCarouselScreen} />
            <RootStack.Screen name="ChatOptions" component={ChatOptionsScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
