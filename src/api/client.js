import { auth } from '../config/firebase';

// Use environment variable if set, otherwise fallback to the production URL
// so the app can connect when running on a physical device over Wi-Fi/Cellular.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://vela-api.onrender.com'; 



export async function apiClient(endpoint, { method = 'GET', body, ...customConfig } = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customConfig.timeout || 10000);

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
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
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
