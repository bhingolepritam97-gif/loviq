import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

const isExpoGo = (Constants.executionEnvironment as string) === 'store-client' || Constants.appOwnership === 'expo';
let Notifications = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('expo-notifications failed to load:', e.message);
  }
}

export function useDeferredOnboardingPrompts({ swipeCount, hasMatched, signupTimestamp, hasPassword }) {
  const shown = useRef({ notifications: false, location: false, password: false });

  useEffect(() => {
    if (swipeCount >= 3 && !shown.current.notifications) {
      shown.current.notifications = true;
      requestNotificationPermission();
    }
    if (swipeCount >= 7 && !shown.current.location) {
      shown.current.location = true;
      requestPreciseLocation();
    }
  }, [swipeCount]);

  useEffect(() => {
    const dayOld = Date.now() - signupTimestamp > 24 * 60 * 60 * 1000;
    if ((hasMatched || dayOld) && !hasPassword && !shown.current.password) {
      shown.current.password = true;
      console.log('[DeferredPrompt] Prompting to secure account with password (Not blocking)');
    }
  }, [hasMatched, signupTimestamp, hasPassword]);
}

async function requestNotificationPermission() {
  if (isExpoGo || !Notifications) {
    console.log('[PushNotifications] Bypassing remote notification permission request in Expo Go (Unsupported since SDK 53)');
    return false;
  }
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn("Notifications permission error", e);
    return false;
  }
}

async function requestPreciseLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn("Location permission error", e);
    return false;
  }
}
