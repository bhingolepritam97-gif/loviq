import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pair-programming local Wi-Fi host IP override was removed for security/production-readiness.
// In development, set EXPO_PUBLIC_API_URL in your .env file to your local IP (e.g. http://192.168.1.5:4000)
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  // If running on an HTTPS web deployment, avoid insecure http:// local IP URLs that trigger browser Mixed Content blocking
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && envUrl?.startsWith('http://')) {
    return 'https://loviq-api.onrender.com';
  }
  if (envUrl) {
    return envUrl;
  }
  return 'https://loviq-api.onrender.com';
};

const BASE_URL = getBaseUrl(); 



export async function apiClient(endpoint: string, { method = 'GET', body, ...customConfig }: any = {}) {
  let token = '';
  try {
    token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    if (!token) {
      // Fallback: check if mock session has stored a token in AsyncStorage
      token = (await AsyncStorage.getItem('mock_user_token')) || '';
    }
  } catch (tokenErr) {
    console.error('[apiClient] Token retrieval failed:', tokenErr.message);
    throw new Error('Invalid or expired token');
  }
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customConfig.timeout || 30000);

  const config: any = {
    method,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    signal: controller.signal,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const cacheKey = `cache_${endpoint}`;
  if (method === 'GET' && customConfig.cache) {
    try {
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        // Default TTL is 5 minutes
        if (Date.now() - cached.timestamp < (customConfig.ttl || 300000)) {
          return cached.data;
        }
      }
    } catch (e) {
      console.warn('[apiClient] Cache read error:', e.message);
    }
  }

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    let data = await response.json();
    
    // Auto-retry once if token has expired or is invalid
    if (!response.ok && (data.error === 'Invalid or expired Firebase token' || response.status === 401)) {
      if (auth.currentUser) {
        console.log('[apiClient] Token expired or invalid. Force-refreshing Firebase ID token...');
        const newToken = await auth.currentUser.getIdToken(true);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), customConfig.timeout || 30000);
        config.signal = retryController.signal;
        
        response = await fetch(`${BASE_URL}${endpoint}`, config);
        clearTimeout(retryTimeoutId);
        data = await response.json();
      }
    }
    
    if (!response.ok) {
      if (data && data.error === 'banned') {
        const banErr: any = new Error('banned');
        banErr.reason = data.reason || 'Violation of community guidelines.';
        banErr.appealEmail = data.appealEmail || 'support@lovly.app';
        throw banErr;
      }
      throw new Error(data.error || 'Something went wrong');
    }
    
    if (method === 'GET' && customConfig.cache) {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {
        console.warn('[apiClient] Cache write error:', e.message);
      }
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    const isNetworkError = error.name === 'AbortError' || error.message?.includes('Network request failed') || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch');
    
    // Offline Mode Graceful Fallback
    if (isNetworkError && method === 'GET' && endpoint !== '/health') {
      console.warn(`[apiClient] Network error on ${endpoint}. Attempting offline fallback...`);
      try {
        const cachedStr = await AsyncStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          console.log(`[apiClient] Offline fallback successful for ${endpoint}`);
          return { ...cached.data, _offlineMode: true };
        }
      } catch (e) {
        console.warn('[apiClient] Offline fallback read error:', e.message);
      }
    }
    
    if (error.name === 'AbortError') {
      if (endpoint !== '/health') console.error(`API Timeout on ${method} ${endpoint}`);
      throw new Error('Request timed out. Please check your connection.');
    }
    if (isNetworkError) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    if (endpoint !== '/health') {
      console.error(`API Error on ${method} ${endpoint}:`, error);
    }
    throw error;
  }
}
