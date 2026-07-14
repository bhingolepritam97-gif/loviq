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
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
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
