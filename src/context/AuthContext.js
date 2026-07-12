import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/UserService';
import { registerForPushNotificationsAsync } from '../services/PushService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase User
  const [profile, setProfile] = useState(null); // Firestore Profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only subscribe if auth is initialized successfully
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          // Register push notifications when user logs in
          registerForPushNotificationsAsync();
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
