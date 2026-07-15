import { auth } from '../config/firebase';

// Pair-programming local Wi-Fi host IP override was removed for security/production-readiness.
// In development, set EXPO_PUBLIC_API_URL in your .env file to your local IP (e.g. http://192.168.1.5:4000)
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://loviq-api.onrender.com';
};

const BASE_URL = getBaseUrl(); 



export async function apiClient(endpoint, { method = 'GET', body, ...customConfig } = {}) {
  let token = '';
  try {
    token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  } catch (tokenErr) {
    console.error('[apiClient] Firebase token retrieval failed:', tokenErr.message);
    throw new Error('Invalid or expired Firebase token');
  }
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customConfig.timeout || 30000);

  const config = {
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
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`API Timeout on ${method} ${endpoint}`);
      throw new Error('Request timed out. Please check your connection.');
    }
    console.error(`API Error on ${method} ${endpoint}:`, error);
    throw error;
  }
}
