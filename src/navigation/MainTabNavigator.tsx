import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import DiscoverScreen from '../screens/browsing/DiscoverScreen';
import ExploreScreen from '../screens/browsing/ExploreScreen';
import LikesYouScreen from '../screens/browsing/LikesYouScreen';
import MatchesInboxScreen from '../screens/chat/MatchesInboxScreen';
import MyProfileScreen from '../screens/profile/MyProfileScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  emoji: string;
  focused: boolean;
  colors?: any;
}

function TabIcon({ emoji, focused, colors }: TabIconProps) {
  const tabStyles = createStyles(colors || {});
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapFocused]}>
      <Text style={tabStyles.icon}>{emoji}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const { colors: Colors } = useTheme();
  const styles = createStyles(Colors);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" focused={focused} colors={Colors} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} colors={Colors} />,
        }}
      />
      <Tab.Screen
        name="Likes"
        component={LikesYouScreen}
        options={{
          tabBarLabel: 'Likes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} colors={Colors} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={MatchesInboxScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} colors={Colors} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MyProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} colors={Colors} />,
        }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  iconWrapFocused: {
    backgroundColor: Colors.primary + '15',
  },
  icon: {
    fontSize: 18,
  },
});
