// PushService.js — Full push notification service using Expo Notifications SDK.
// Handles permission requests, push token retrieval, and backend registration.
//
// For standalone EAS builds, ensure the following is set in app.json:
//   "plugins": [["expo-notifications", { "icon": "./assets/icon.png", "color": "#ffffff" }]]
// And google-services.json / GoogleService-Info.plist are placed at the project root.

import { Platform } from 'react-native';

let Notifications = null;
let Constants = null;
let Device = null;

// Lazy-load expo-notifications so Expo Go stays uncrashed if misconfigured
try {
  Notifications = require('expo-notifications');
  Constants = require('expo-constants').default;
  Device = require('expo-device');
} catch (e) {
  console.warn('[PushService] expo-notifications not available:', e.message);
}

// Configure how notifications look when the app is in the foreground
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Requests push permission and returns the Expo push token string.
 * Returns null on simulators, devices without notification support, or on permission denial.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Notifications || !Device) {
    return null;
  }

  // Push notifications don't work on simulators/emulators
  if (!Device.isDevice) {
    console.log('[PushService] Must use physical device for push notifications.');
    return null;
  }

  try {
    // Check existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only request if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushService] Push notification permission denied.');
      return null;
    }

    // Retrieve the Expo push token (works for both Expo Go and standalone)
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId
      ?? Constants?.manifest?.extra?.eas?.projectId
      ?? Constants?.manifest2?.extra?.eas?.projectId;

    let tokenData;
    if (projectId) {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    } else {
      // Fallback for Expo Go / dev builds without a project ID configured
      tokenData = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenData?.data;
    console.log('[PushService] Expo Push Token acquired:', token);

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });
    }

    return token;
  } catch (err) {
    console.warn('[PushService] Failed to register for push notifications:', err.message);
    return null;
  }
}

/**
 * Adds a listener for incoming notifications when the app is in the foreground.
 * Returns a cleanup function — call it when your component unmounts.
 */
export function addNotificationReceivedListener(handler) {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

/**
 * Adds a listener for when the user taps a notification.
 * Returns a cleanup function — call it when your component unmounts.
 */
export function addNotificationResponseListener(handler) {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
}

