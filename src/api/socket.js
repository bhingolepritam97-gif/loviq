import { io } from 'socket.io-client';
import { auth } from '../config/firebase';

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

    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

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
      
      // Auto-retry connection with a fresh token if current is expired/invalid, up to 2 times
      if (err.message === 'Invalid or expired Firebase token' || err.message.includes('expired') || err.message.includes('token')) {
        if (auth.currentUser && this.retryCount < 2) {
          this.retryCount++;
          console.log(`[SocketService] Socket token invalid/expired. Force-refreshing token and reconnecting (attempt ${this.retryCount}/2)...`);
          try {
            const newToken = await auth.currentUser.getIdToken(true);
            this.socket.auth.token = newToken;
            this.socket.connect();
          } catch (tokenErr) {
            console.error('[SocketService] Failed to refresh token during socket reconnect:', tokenErr.message);
          }
        } else if (this.retryCount >= 2) {
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
