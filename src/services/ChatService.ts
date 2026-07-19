import { auth } from '../config/firebase';
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
    read: m.read !== false,
    // Women Message First permission fields
    restrictedMode: m.restrictedMode || false,
    onlyUserIdCanMessageFirst: m.onlyUserIdCanMessageFirst || null,
    messageDeadline: m.messageDeadline || null,
    firstMessageSent: m.firstMessageSent || false,
  };
}

export const fetchMatches = async () => {
  try {
    const response = await apiClient('/matches', { cache: true, ttl: 300000 });
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
    const response = await apiClient(`/matches/${matchId}`, { cache: true, ttl: 300000 });
    if (response.success && response.match) {
      return mapBackendMatch(response.match);
    }
    return null;
  } catch (err) {
    console.warn('Error fetching single match from backend REST API:', err.message);
    return null;
  }
};

export const fetchMatchMessages = async (matchId, cursor = null, limit = 50) => {
  if (!matchId) return [];
  try {
    let url = `/matches/${matchId}/messages?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    const response = await apiClient(url, { cache: true, ttl: 300000 });
    if (response.success && Array.isArray(response.messages)) {
      return response.messages.map((m) => ({
        id: m.id.toString(),
        senderId: m.senderId,
        text: m.content,
        timestamp: m.createdAt,
        read: true,
        scamWarningTriggered: m.scamWarningTriggered || false,
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
        read: false,
        scamWarningTriggered: m.scamWarningTriggered || response.scamWarningTriggered || false
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
    
    const handleNewMessage = (msg) => {
      if (!msg) return;
      const formattedMsg = {
        id: msg.id ? msg.id.toString() : Date.now().toString(),
        senderId: msg.senderId,
        text: msg.content,
        timestamp: msg.createdAt || new Date().toISOString(),
        read: true,
        scamWarningTriggered: msg.scamWarningTriggered || false,
      };
      callback(formattedMsg, true);
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
  const socket = socketService.getSocket();
  if (socket) {
    socket.emit("mark_read", { matchId });
  }
};

export const fetchIcebreakers = async (matchId) => {
  try {
    const response = await apiClient(`/matches/${matchId}/starters`, { cache: true, ttl: 300000 });
    if (response.success && Array.isArray(response.starters)) {
      return response.starters;
    }
    return [];
  } catch (err) {
    console.warn('[ChatService] Error fetching icebreakers:', err.message);
    return [];
  }
};
