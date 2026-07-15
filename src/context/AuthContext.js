import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, updateUserProfile } from '../services/UserService';
import { registerForPushNotificationsAsync } from '../services/PushService';
import { Purchases } from '../services/RevenueCatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * captureLocationForUser — plain async helper (not a hook) so it can be
 * called outside a component render cycle (e.g. inside onAuthStateChanged).
 */
async function captureLocationForUser(uid, existingProfile) {
  // Skip if location is already stored
  if (existingProfile?.location?.latitude) return null;
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy?.Balanced ?? 3,
    });
    if (!loc?.coords) return null;

    const { latitude, longitude } = loc.coords;
    let cityName = 'Nearby';
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      cityName = places?.[0]?.city || places?.[0]?.subregion || places?.[0]?.region || cityName;
    } catch (_) { /* non-critical */ }

    // updateUserProfile handles REST PATCH + Firestore geohash write
    return await updateUserProfile(uid, { location: { latitude, longitude, cityName } });
  } catch (err) {
    console.warn('[AuthContext] Background location capture failed (non-critical):', err.message);
    return null;
  }
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase User
  const [profile, setProfile] = useState(null); // Firestore Profile
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Only subscribe if auth is initialized successfully
    if (!auth) {
      setLoading(false);
      return;
    }

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      console.warn('⚠️ Firebase auth initialization timed out. Proceeding...');
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      if (firebaseUser) {
        setUser(firebaseUser);
        setConnectionError(false);
        try {
          let userProfile = null;

          // 20-second timeout limit for fetching profile from Postgres (handles cold-starts)
          const fetchPromise = getUserProfile(firebaseUser.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timed out')), 20000)
          );

          let isAuthError = false;
          try {
            userProfile = await Promise.race([fetchPromise, timeoutPromise]);
          } catch (fetchErr) {
            console.warn('Profile fetch timed out or failed:', fetchErr.message);
            if (fetchErr.message.includes('auth/') || fetchErr.message.includes('credential') || fetchErr.message.includes('token') || fetchErr.message.includes('Expired') || fetchErr.message.includes('Unauthorized')) {
              isAuthError = true;
            }
          }

          if (isAuthError) {
            console.log('[AuthContext] Auth token invalid/expired. Logging out...');
            setUser(null);
            setProfile(null);
            await signOut(auth);
            setLoading(false);
            return;
          }
          
          if (!userProfile) {
            try {
              const isLocalComplete = await AsyncStorage.getItem(`profileComplete_${firebaseUser.uid}`);
              if (isLocalComplete === 'true') {
                userProfile = { 
                  profileComplete: true,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || ''
                };
              }
            } catch (e) {
              console.warn('Failed to read local profileComplete status:', e);
            }
          }
          
          if (userProfile) {
            setProfile(userProfile);
            setConnectionError(false);
          } else {
            // Failed to load from network and no local storage backup exists
            setConnectionError(true);
          }

          // Configure RevenueCat and check entitlement in the background
          if (userProfile) {
            (async () => {
              try {
                Purchases.configure({ appUserID: firebaseUser.uid });
                const customerInfo = await Purchases.getCustomerInfo();
                const isPremium = typeof customerInfo.entitlements.active['gold'] !== "undefined";
                
                if (userProfile.isPremium !== isPremium) {
                   userProfile.isPremium = isPremium;
                   await updateUserProfile(firebaseUser.uid, { isPremium });
                }
              } catch (rcError) {
                console.warn('[RevenueCat] Background configure failed:', rcError.message);
              }
            })();
          }
          
          // Register push notifications when user logs in
          registerForPushNotificationsAsync();

          // Eagerly capture location after login if the profile doesn't have one yet.
          // Fire-and-forget: update the profile in state if successful.
          if (userProfile) {
            captureLocationForUser(firebaseUser.uid, userProfile).then((updated) => {
              if (updated) {
                setProfile(updated);
              }
            });
          }
        } catch (error) {
          console.warn("Error inside authStateChanged profile setup:", error.message);
          setConnectionError(true);
        }
      } else {
        setUser(null);
        setProfile(null);
        setConnectionError(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      setConnectionError(false);
      try {
        const fetchPromise = getUserProfile(user.uid);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timed out')), 20000)
        );
        const userProfile = await Promise.race([fetchPromise, timeoutPromise]);
        if (userProfile) {
          setProfile(userProfile);
          setConnectionError(false);
        } else {
          setConnectionError(true);
        }
      } catch (err) {
        console.warn('Refresh profile failed:', err.message);
        if (err.message.includes('auth/') || err.message.includes('credential') || err.message.includes('token') || err.message.includes('Expired') || err.message.includes('Unauthorized')) {
          console.log('[AuthContext] Auth token invalid/expired during refresh. Logging out...');
          setUser(null);
          setProfile(null);
          await signOut(auth);
        } else {
          setConnectionError(true);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, connectionError, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
