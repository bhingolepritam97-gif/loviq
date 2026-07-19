import { initializeApp, getApps, getApp } from 'firebase/app';
// Note: getReactNativePersistence is available via firebase/auth/react-native in newer SDKs
import { initializeAuth } from 'firebase/auth';

// Try to import getReactNativePersistence for SecureStore persistence
let getReactNativePersistence: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
} catch (_) {
  getReactNativePersistence = null;
}
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as SecureStore from 'expo-secure-store';

const sanitizeKey = (key) => key.replace(/[^a-zA-Z0-9._-]/g, '_');

const SecureStorage = {
  getItem: (key) => SecureStore.getItemAsync(sanitizeKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(sanitizeKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(sanitizeKey(key)),
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth;
let db;
let storage;

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'AIzaSyA1...';

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Auth with encrypted SecureStore persistence (when available)
    if (getReactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(SecureStorage)
      });
    } else {
      auth = initializeAuth(app);
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('🔥 Firebase initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
} else {
  console.warn(
    '⚠️ Firebase is not configured. Please edit the .env file in the project root to insert your actual Firebase Console keys.'
  );
}

export { app, auth, db, storage, isConfigured };
