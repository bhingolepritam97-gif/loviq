import { db, auth } from '../config/firebase';
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, onSnapshot, where } from 'firebase/firestore';
import { apiClient } from '../api/client';
import { socketService } from '../api/socket';

function mapBackendUserToProfile(u) {
  if (!u) return null;
  
  // Compute age from birthdate
  let age = 28; // default fallback
  if (u.birthdate) {
    const birth = new Date(u.birthdate);
    age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  } else if (u.age) {
    age = u.age;
  }

  // Extract photos URLs in correct order
  let photos = [];
  if (u.photos && Array.isArray(u.photos)) {
    photos = [...u.photos]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(p => typeof p === 'string' ? p : p.url);
  }

  return {
    id: u.id,
    name: u.name || '',
    displayName: u.name || '',
    age,
    gender: u.gender || '',
    bio: u.bio || '',
    interests: u.interests || [],
    photos,
    cityName: u.cityName || '',
  };
}

function mapBackendMatch(m) {
  return {
    id: m.matchId,
    lastMessage: m.lastMessage || null,
    lastMessageTime: m.lastMessageTime || m.matchedAt,
    otherUser: mapBackendUserToProfile(m.user),
  };
}

export const fetchMatches = async () => {
  try {
    const response = await apiClient('/matches');
    if (response.success && Array.isArray(response.matches)) {
      return response.matches.map(mapBackendMatch).filter(m => m.otherUser !== null);
    }
    return [];
  } catch (err) {
    console.warn('Error fetching matches from backend REST API:', err.message);
    return [];
  }
};

export const fetchMatch = async (matchId) => {
  if (!matchId) return null;
  try {
    const response = await apiClient(`/matches/${matchId}`);
    if (response.success && response.match) {
      return mapBackendMatch(response.match);
    }
    return null;
  } catch (err) {
    console.warn('Error fetching single match from backend REST API:', err.message);
    return null;
  }
};

export const fetchMatchMessages = async (matchId) => {
  if (!matchId) return [];
  try {
    const response = await apiClient(`/matches/${matchId}/messages`);
    if (response.success && Array.isArray(response.messages)) {
      return response.messages.map((m) => ({
        id: m.id.toString(),
        senderId: m.senderId,
        text: m.content,
        timestamp: m.createdAt,
        read: true,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Error fetching messages from Postgres REST API:', err.message);
    return [];
  }
};

export const sendMessage = async (matchId, senderId, text) => {
  if (!matchId || !senderId || !text.trim()) return null;
  try {
    const response = await apiClient(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: { content: text.trim() }
    });
    if (response.success && response.message) {
      const m = response.message;
      return {
        id: m.id.toString(),
        senderId: m.senderId,
        text: m.content,
        timestamp: m.createdAt,
        read: false
      };
    }
    return null;
  } catch (err) {
    console.error('Error sending message via Postgres REST API:', err);
    return null;
  }
};

export const subscribeToMessages = (matchId, callback) => {
  if (!matchId) return () => {};
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit("join_match", matchId);
    
    const handleNewMessage = async () => {
      const updated = await fetchMatchMessages(matchId);
      callback(updated);
    };
    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }
  return () => {};
};

export const subscribeToMatches = (callback) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return () => {};

  let active = true;
  fetchMatches().then(res => {
    if (active) callback(res);
  });

  // Since HTTP is not socket based in MVP, fetch once on focus
  return () => {
    active = false;
  };
};

export const updateTypingStatus = async (matchId, userId, isTyping) => {
  if (!matchId || !userId) return;
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit("typing", { matchId, isTyping });
  }
};

export const markMessagesAsRead = async (matchId, userId) => {
  if (!matchId || !userId) return;
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const q = query(messagesRef, where('senderId', '!=', userId), where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    const updatePromises = [];
    querySnapshot.forEach((d) => {
      updatePromises.push(updateDoc(d.ref, { read: true }));
    });
    await Promise.all(updatePromises);
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
};
