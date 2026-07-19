import { io } from 'socket.io-client';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://loviq-api.onrender.com';
};

const BASE_URL = getBaseUrl();


class SocketService {
  socket = null;
  retryCount = 0;

  connect = async () => {
    if (this.socket) return this.socket;

    let token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    if (!token) {
      token = (await AsyncStorage.getItem('mock_user_token')) || '';
    }

    this.socket = io(BASE_URL, {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.retryCount = 0;
    });

    this.socket.on('connect_error', async (err) => {
      console.error('Socket connection error:', err.message);
      
      // Auto-retry connection with exponential backoff on auth rejection
      if (err.message === 'Invalid or expired Firebase token' || err.message.includes('expired') || err.message.includes('token') || err.message.includes('auth')) {
        if (auth.currentUser && this.retryCount < 5) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount - 1) * 1000;
          console.log(`[SocketService] Auth error. Force-refreshing token and reconnecting in ${delay}ms (attempt ${this.retryCount}/5)...`);
          
          setTimeout(async () => {
            try {
              if (auth.currentUser && this.socket) {
                const newToken = await auth.currentUser.getIdToken(true);
                this.socket.auth.token = newToken;
                this.socket.connect();
              }
            } catch (tokenErr) {
              console.error('[SocketService] Failed to refresh token during socket reconnect:', tokenErr.message);
            }
          }, delay);
        } else if (this.retryCount >= 5) {
          console.warn('[SocketService] Maximum socket reconnect attempts reached. Stopping retries.');
        }
      }
    });

    return this.socket;
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  };

  getSocket = () => this.socket;
}

export const socketService = new SocketService();
