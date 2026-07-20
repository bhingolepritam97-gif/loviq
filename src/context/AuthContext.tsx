import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, updateUserProfile, savePushToken, ensureUserDocument } from '../services/UserService';
import { registerForPushNotificationsAsync } from '../services/PushService';
import { configureRevenueCat, Purchases } from '../services/RevenueCatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from '../services/AnalyticsService';

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
      accuracy: Location.Accuracy.High,
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

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase User
  const [profile, setProfile] = useState(null); // Firestore Profile
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Restore mock user session on app start
  useEffect(() => {
    const loadMockUser = async () => {
      try {
        const savedMockUid = await AsyncStorage.getItem('mock_user_token');
        if (savedMockUid && savedMockUid.startsWith('mock_')) {
          setUser({
            uid: savedMockUid,
            email: 'mockuser@lovly.app',
            phoneNumber: '+919999999999',
          });
        }
      } catch (e) {
        console.warn('[AuthContext] Failed to load mock user from AsyncStorage:', e);
      }
    };
    loadMockUser();
  }, []);

  // Monitor user state changes to sync mock token in AsyncStorage and load profile
  useEffect(() => {
    if (user) {
      if (user.uid.startsWith('mock_')) {
        AsyncStorage.setItem('mock_user_token', user.uid).catch(err => console.warn(err));
        
        // Eagerly load profile for mock session
        setLoading(true);
        setConnectionError(false);
        getUserProfile(user.uid)
          .then((userProfile) => {
            if (userProfile) {
              setProfile(userProfile);
            } else {
              setProfile({ profileComplete: false });
            }
          })
          .catch((err) => {
            console.warn('[AuthContext] Mock profile fetch failed:', err.message);
            setProfile({ profileComplete: false });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      AsyncStorage.removeItem('mock_user_token').catch(err => console.warn(err));
    }
  }, [user]);

  useEffect(() => {
    // Only subscribe if auth is initialized successfully
    if (!auth) {
      console.log('[AuthContext] ⚠️ Firebase not initialized — skipping auth listener.');
      setLoading(false);
      return;
    }

    console.log('[AuthContext] 🔥 Firebase Initialized — starting auth state listener.');

    const safetyTimeout = setTimeout(() => {
      if (user && user.uid.startsWith('mock_')) return; // skip timeout warning if mock user is active
      setLoading(false);
      console.warn('[AuthContext] ⚠️ Firebase auth initialization timed out. Proceeding...');
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      if (firebaseUser) {
        console.log('[AuthContext] 🚀 Authentication Started — onAuthStateChanged fired.');
        console.log('[AuthContext] ✅ Authentication Success — uid received:', firebaseUser.uid);
        console.log('[AuthContext] 🔑 UID Received:', firebaseUser.uid);
        // Bug Fix: Ensure users/{uid} exists in Firestore on every login (first login creates it)
        ensureUserDocument(firebaseUser.uid, firebaseUser); // fire-and-forget, never blocks auth

        // FIX Bug 1: Set loading=true immediately so AppNavigator shows spinner (not a flash
        // of the wrong screen) while we fetch the profile from the backend.
        // On cold-start loading is already true; on subsequent logins it was false — causing
        // a 1-2 second flash of the BasicInfo onboarding screen.
        setLoading(true);

        setUser(firebaseUser);
        setConnectionError(false);
        AnalyticsService.setUserId(firebaseUser.uid);
        console.log('[Login] STEP 2: auth.currentUser.uid verified:', firebaseUser.uid);
        try {
          let userProfile = null;
          console.log('[AuthContext] 📖 Firestore Read Started — fetching user profile from backend...');

          // 20-second timeout limit for fetching profile from Postgres (handles cold-starts)
          const fetchPromise = getUserProfile(firebaseUser.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timed out')), 20000)
          );

          let isAuthError = false;
          let isBanError = false;
          try {
            userProfile = await Promise.race([fetchPromise, timeoutPromise]);
            if (userProfile) {
              console.log('[AuthContext] ✅ Firestore Read Success — profile loaded. profileComplete:', userProfile?.profileComplete, '| name:', userProfile?.name);
              console.log('[AuthContext] 👤 Profile Loaded — uid:', firebaseUser.uid);
            } else {
              console.log('[AuthContext] ℹ️ Profile Created (new user) — no existing profile found. Will start onboarding.');
            }
          } catch (fetchErr) {
            console.warn('Profile fetch timed out or failed:', fetchErr.message);
            if (fetchErr.message === 'banned') {
              isBanError = true;
              setIsBanned(true);
              setBanReason(fetchErr.reason || 'Violation of community guidelines.');
            } else if (fetchErr.message.includes('auth/') || fetchErr.message.includes('credential') || fetchErr.message.includes('token') || fetchErr.message.includes('Expired') || fetchErr.message.includes('Unauthorized')) {
              isAuthError = true;
            }
          }

          if (isBanError) {
            setUser(firebaseUser);
            setProfile(null);
            setLoading(false);
            return;
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
              userProfile = { 
                profileComplete: isLocalComplete === 'true',
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                photos: [],
                interests: [],
              };
            } catch (e) {
              console.warn('Failed to read local profileComplete status:', e);
              userProfile = { 
                profileComplete: false,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
              };
            }
          }
          
          if (userProfile?.profileComplete) {
            try {
              await AsyncStorage.setItem(`profileComplete_${firebaseUser.uid}`, 'true');
            } catch (e) {
              console.warn('[AuthContext] Failed to persist local profileComplete flag:', e);
            }
          }

          // FIX: Do NOT overwrite a locally-completed profile with stale backend data.
          // PhotoUploadScreen calls setProfile({...profileComplete:true}) right after the PATCH.
          // onAuthStateChanged fires in parallel and would overwrite with profileComplete:false
          // (the backend returns false until the DB write fully commits), causing an infinite spinner.
          setProfile((currentProfile) => {
            if (currentProfile?.profileComplete === true) {
              console.log('[AuthContext] ⚡ Skipping profile overwrite — already complete in state (signup race guard).');
              return currentProfile;
            }
            console.log('[AuthContext] ✅ Firestore Write Success — Auth store updated. profileComplete:', userProfile?.profileComplete);
            return userProfile;
          });
          setConnectionError(false);
          AnalyticsService.setUserProperties({
            isPremium: userProfile.isPremium ? 'true' : 'false',
            profileComplete: userProfile.profileComplete ? 'true' : 'false',
            gender: userProfile.gender || null,
          });
          console.log('[AuthContext] 🧭 Navigation Started — profileComplete:', userProfile?.profileComplete, '→', userProfile?.profileComplete ? 'Discover' : 'Onboarding');
          console.log('[AuthContext] ✅ Navigation Success — AppNavigator will render correct stack.');


          // Configure RevenueCat and check entitlement in the background
          if (userProfile) {
            (async () => {
              try {
                configureRevenueCat(firebaseUser.uid);
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
          
          // Register push notifications when user logs in and save token to backend
          (async () => {
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
              // Fire-and-forget: non-critical, don't block login flow
              savePushToken(pushToken).catch(e =>
                console.warn('[AuthContext] savePushToken failed:', e.message)
              );
            }
          })();

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
          console.error('[Login] FAILED — Error during profile setup:', error.code || '', error.message);
          setConnectionError(true);
        }
      } else {
        console.log('[AuthContext] 🔓 Logout Success — onAuthStateChanged: user signed out, clearing state.');
        setUser(null);
        setProfile(null);
        setConnectionError(false);
      }
      console.log('[AuthContext] ⏹️ setLoading(false) — spinner stopped.');
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
          setIsBanned(false);
          setBanReason('');
        } else {
          setConnectionError(true);
        }
      } catch (err) {
        console.warn('Refresh profile failed:', err.message);
        if (err.message === 'banned') {
          setIsBanned(true);
          setBanReason(err.reason || 'Violation of community guidelines.');
          setProfile(null);
        } else if (err.message.includes('auth/') || err.message.includes('credential') || err.message.includes('token') || err.message.includes('Expired') || err.message.includes('Unauthorized')) {
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
    <AuthContext.Provider value={{ user, setUser, profile, loading, connectionError, refreshProfile, setProfile, isBanned, banReason, setIsBanned, setBanReason }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
