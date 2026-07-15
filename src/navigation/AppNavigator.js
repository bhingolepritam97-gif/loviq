import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
import PhotoVerificationScreen from '../screens/profile/PhotoVerificationScreen';
import AnalyticsScreen from '../screens/profile/AnalyticsScreen';
import BlockedContactsScreen from '../screens/profile/BlockedContactsScreen';
import SupportScreen from '../screens/profile/SupportScreen';

import ChatScreen from '../screens/chat/ChatScreen';
import NewMatchCarouselScreen from '../screens/chat/NewMatchCarouselScreen';
import ChatOptionsScreen from '../screens/chat/ChatOptionsScreen';
import ReportUserScreen from '../screens/chat/ReportUserScreen';
import SafetyCenterScreen from '../screens/chat/SafetyCenterScreen';
import CallRingingScreen from '../screens/chat/CallRingingScreen';
import ActiveCallScreen from '../screens/chat/ActiveCallScreen';

import { useAuth } from '../context/AuthContext';
import { socketService } from '../api/socket';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const RootStack = createStackNavigator();
const navigationRef = React.createRef();

const linking = {
  prefixes: ['vela://', 'https://velaapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Discover: 'discover',
          Explore: 'explore',
          Likes: 'likes',
          Chats: 'chats',
          Profile: 'profile',
        },
      },
      Chat: 'chat/:matchId',
      Premium: 'premium',
      ActiveCall: 'call/:fromUserId/:callType',
    },
  },
};

export default function AppNavigator() {
  const { user, profile, loading, connectionError, refreshProfile } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  // WebRTC socket listener for incoming calls
  useEffect(() => {
    if (user && profile?.profileComplete) {
      socketService.connect().then(socket => {
        if (socket) {
          socket.off('call_incoming'); // Clear existing listeners to prevent duplication
          socket.on('call_incoming', (data) => {
            setIncomingCall(data);
            Animated.spring(slideAnim, {
              toValue: 30, // Slide down past status bar
              useNativeDriver: true,
              tension: 45,
              friction: 9,
            }).start();
          });
        }
      });
    } else {
      socketService.disconnect();
    }
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('call_incoming');
      }
    };
  }, [user, profile]);

  const dismissCallBanner = (callback) => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIncomingCall(null);
      if (callback) callback();
    });
  };

  const handleAcceptBanner = () => {
    const data = incomingCall;
    if (!data) return;
    
    dismissCallBanner(() => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit("accept_call", { targetUserId: data.fromUserId });
      }
      navigationRef.current?.navigate('ActiveCall', {
        profile: { id: data.fromUserId, name: data.fromUserName },
        callType: data.callType,
      });
    });
  };

  const handleDeclineBanner = () => {
    const data = incomingCall;
    if (!data) return;
    
    dismissCallBanner(() => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit("end_call", { targetUserId: data.fromUserId });
      }
    });
  };

  const handleTapBanner = () => {
    const data = incomingCall;
    if (!data) return;
    
    dismissCallBanner(() => {
      navigationRef.current?.navigate('CallRinging', {
        profile: { id: data.fromUserId, name: data.fromUserName },
        callType: data.callType,
        signalData: data.signalData,
        isIncoming: true
      });
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (user && connectionError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={76} color={Colors.primary} style={{ marginBottom: Spacing.xl }} />
        <Text style={styles.errorTitle}>Connection Timeout</Text>
        <Text style={styles.errorMessage}>
          Unable to connect to Vela servers. Please check your network connection and verify your local server is running.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshProfile}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginTop: Spacing.xl }} 
          onPress={async () => {
            try {
              if (user) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.removeItem(`profileComplete_${user.uid}`);
              }
            } catch (e) {
              console.warn('Failed clearing profileComplete in AppNavigator logout:', e.message);
            }
            await signOut(auth);
          }}
        >
          <Text style={{ color: Colors.textMuted, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // Unauthenticated Flow
            <RootStack.Screen name="Onboarding">
              {(props) => <OnboardingNavigator {...props} initialRouteName="Splash" />}
            </RootStack.Screen>
          ) : !profile?.profileComplete ? (
            // Authenticated but profile incomplete
            <RootStack.Screen name="Onboarding">
              {(props) => <OnboardingNavigator {...props} initialRouteName="BasicInfo" />}
            </RootStack.Screen>
          ) : (
            // Authenticated and complete profile
            <>
              <RootStack.Screen name="Main" component={MainTabNavigator} />
              
              {/* Browsing Modals / Stack screens */}
              <RootStack.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
              <RootStack.Screen name="Match" component={MatchScreen} options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }} />
              <RootStack.Screen name="SuperLike" component={SuperLikeScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="Rewind" component={RewindScreen} options={{ presentation: 'modal' }} />

              {/* Profile Stack screens */}
              <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
              <RootStack.Screen name="Settings" component={SettingsScreen} />
              <RootStack.Screen name="Preferences" component={PreferencesScreen} />
              <RootStack.Screen name="Premium" component={PremiumScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="ManagePhotos" component={ManagePhotosScreen} />
              <RootStack.Screen name="ManagePrompts" component={ManagePromptsScreen} />
              <RootStack.Screen name="PhotoVerification" component={PhotoVerificationScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="Analytics" component={AnalyticsScreen} />
              <RootStack.Screen name="BlockedContacts" component={BlockedContactsScreen} />
              <RootStack.Screen name="Support" component={SupportScreen} />

              {/* Chat Stack screens */}
              <RootStack.Screen name="Chat" component={ChatScreen} />
              <RootStack.Screen name="NewMatchCarousel" component={NewMatchCarouselScreen} />
              <RootStack.Screen name="ChatOptions" component={ChatOptionsScreen} />
              <RootStack.Screen name="ReportUser" component={ReportUserScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="SafetyCenter" component={SafetyCenterScreen} options={{ presentation: 'modal' }} />
              <RootStack.Screen name="CallRinging" component={CallRingingScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              <RootStack.Screen name="ActiveCall" component={ActiveCallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>

      {/* Floating In-App Incoming Call Banner */}
      {incomingCall && (
        <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleTapBanner} style={styles.bannerLeft}>
            <View style={styles.callIconWrap}>
              <Ionicons 
                name={incomingCall.callType === 'video' ? 'videocam' : 'call'} 
                size={22} 
                color="#FF3A5C" 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Incoming {incomingCall.callType} call</Text>
              <Text style={styles.bannerText} numberOfLines={1}>{incomingCall.fromUserName}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bannerRight}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleDeclineBanner} 
              style={[styles.bannerBtn, styles.declineBtn]}
            >
              <Ionicons name="close" size={20} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleAcceptBanner} 
              style={[styles.bannerBtn, styles.acceptBtn]}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#1E1E2E',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    ...Shadow.lg,
    borderWidth: 1.5,
    borderColor: '#FF3A5C20',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3A5C12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  bannerTitle: {
    fontSize: 10,
    color: '#FF3A5C',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bannerText: {
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  bannerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: '#EA433515',
    borderWidth: 1,
    borderColor: '#EA433530',
  },
  acceptBtn: {
    backgroundColor: '#34A853',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
