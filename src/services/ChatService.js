import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';

import { apiClient } from '../api/client';

export const fetchMatches = async () => {
  try {
    const data = await apiClient('/matches');
    return data.matches.map(m => ({
      id: m.matchId,
      lastMessage: null, // Stub for now until messaging is implemented via REST
      lastMessageTime: m.matchedAt,
      otherUser: m.user,
    }));
  } catch (err) {
    console.error('Error fetching matches via API:', err);
    return [];
  }
};

export const fetchMatch = async (matchId) => {
  if (!matchId) return null;
  try {
    const data = await apiClient(`/matches/${matchId}`);
    if (data.match) {
      return {
        id: data.match.matchId,
        lastMessage: null,
        lastMessageTime: data.match.matchedAt,
        otherUser: data.match.user,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching single match via API:', err);
    return null;
  }
};

export const fetchMatchMessages = async (matchId) => {
  if (!matchId) return [];
  try {
    const data = await apiClient(`/matches/${matchId}/messages`);
    return data.messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      text: m.content,
      timestamp: m.createdAt,
      read: m.read
    }));
  } catch (err) {
    console.error('Error fetching messages via API:', err);
    return [];
  }
};

export const sendMessage = async (matchId, senderId, text) => {
  if (!matchId || !senderId || !text.trim()) return null;

  try {
    const data = await apiClient(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: { content: text.trim() }
    });
    const m = data.message;
    return {
      id: m.id,
      senderId: m.senderId,
      text: m.content,
      timestamp: m.createdAt,
      read: m.read
    };
  } catch (err) {
    console.error('Error sending message via API:', err);
    return null;
  }
};
