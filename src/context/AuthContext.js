import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, updateUserProfile } from '../services/UserService';
import { registerForPushNotificationsAsync } from '../services/PushService';
import { Purchases } from '../services/RevenueCatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

          // 4-second timeout limit for fetching profile from Postgres
          const fetchPromise = getUserProfile(firebaseUser.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timed out')), 4000)
          );

          try {
            userProfile = await Promise.race([fetchPromise, timeoutPromise]);
          } catch (fetchErr) {
            console.warn('Profile fetch timed out or failed:', fetchErr.message);
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
          setTimeout(() => reject(new Error('Profile fetch timed out')), 4000)
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
        setConnectionError(true);
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
