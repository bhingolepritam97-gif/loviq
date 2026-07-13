import { db, auth } from '../config/firebase';
import { collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export const fetchMatches = async () => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return [];
  
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'array-contains', currentUid));
    const querySnapshot = await getDocs(q);
    
    const matches = [];
    for (const d of querySnapshot.docs) {
      const matchData = d.data();
      const otherUserId = matchData.users.find(uid => uid !== currentUid);
      
      // Fetch the other user's profile
      let otherUser = null;
      if (otherUserId) {
        const userSnap = await getDoc(doc(db, 'profiles', otherUserId));
        if (userSnap.exists()) {
          otherUser = { id: userSnap.id, ...userSnap.data() };
        }
      }
      
      matches.push({
        id: d.id,
        lastMessage: matchData.lastMessage || null,
        lastMessageTime: matchData.lastMessageTime || matchData.matchedAt,
        otherUser: otherUser,
      });
    }
    
    // Sort by most recent activity
    return matches.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  } catch (err) {
    console.error('Error fetching matches from Firestore:', err);
    return [];
  }
};

export const fetchMatch = async (matchId) => {
  const currentUid = auth.currentUser?.uid;
  if (!matchId || !currentUid) return null;
  try {
    const docSnap = await getDoc(doc(db, 'matches', matchId));
    if (docSnap.exists()) {
      const matchData = docSnap.data();
      const otherUserId = matchData.users.find(uid => uid !== currentUid);
      
      let otherUser = null;
      if (otherUserId) {
        const userSnap = await getDoc(doc(db, 'profiles', otherUserId));
        if (userSnap.exists()) {
          otherUser = { id: userSnap.id, ...userSnap.data() };
        }
      }
      
      return {
        id: docSnap.id,
        lastMessage: matchData.lastMessage || null,
        lastMessageTime: matchData.lastMessageTime || matchData.matchedAt,
        otherUser: otherUser,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching single match from Firestore:', err);
    return null;
  }
};

export const fetchMatchMessages = async (matchId) => {
  if (!matchId) return [];
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach((d) => {
      messages.push({
        id: d.id,
        senderId: d.data().senderId,
        text: d.data().content,
        timestamp: d.data().createdAt,
        read: d.data().read
      });
    });
    return messages;
  } catch (err) {
    console.error('Error fetching messages from Firestore:', err);
    return [];
  }
};

export const sendMessage = async (matchId, senderId, text) => {
  if (!matchId || !senderId || !text.trim()) return null;

  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const timestamp = new Date().toISOString();
    
    const docRef = await addDoc(messagesRef, {
      senderId,
      content: text.trim(),
      createdAt: timestamp,
      read: false
    });
    
    // Update the parent match document with last message
    await updateDoc(doc(db, 'matches', matchId), {
      lastMessage: text.trim(),
      lastMessageTime: timestamp
    });
    
    return {
      id: docRef.id,
      senderId,
      text: text.trim(),
      timestamp,
      read: false
    };
  } catch (err) {
    console.error('Error sending message via Firestore:', err);
    return null;
  }
};



export const subscribeToMessages = (matchId, callback) => {
  if (!matchId) return () => {};
  
  const messagesRef = collection(db, 'matches', matchId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((d) => {
      messages.push({
        id: d.id,
        senderId: d.data().senderId,
        text: d.data().content,
        timestamp: d.data().createdAt,
        read: d.data().read
      });
    });
    callback(messages);
  });
  
  return unsubscribe;
};

export const subscribeToMatches = (callback) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return () => {};

  const matchesRef = collection(db, 'matches');
  const q = query(matchesRef, where('users', 'array-contains', currentUid));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const matches = [];
    for (const d of snapshot.docs) {
      const matchData = d.data();
      const otherUserId = matchData.users.find(uid => uid !== currentUid);
      
      let otherUser = null;
      if (otherUserId) {
        const userSnap = await getDoc(doc(db, 'profiles', otherUserId));
        if (userSnap.exists()) {
          otherUser = { id: userSnap.id, ...userSnap.data() };
        }
      }
      
      matches.push({
        id: d.id,
        lastMessage: matchData.lastMessage || null,
        lastMessageTime: matchData.lastMessageTime || matchData.matchedAt,
        read: matchData.lastMessage ? false : true, // Simplification: in real app, track read status per user
        typing: matchData.typing || {},
        otherUser: otherUser,
      });
    }
    
    // Sort by most recent activity
    matches.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    callback(matches);
  });

  return unsubscribe;
};

export const updateTypingStatus = async (matchId, userId, isTyping) => {
  if (!matchId || !userId) return;
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      [`typing.${userId}`]: isTyping
    });
  } catch (err) {
    console.error('Error updating typing status:', err);
  }
};

export const markMessagesAsRead = async (matchId, userId) => {
  if (!matchId || !userId) return;
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const q = query(messagesRef, where('senderId', '!=', userId), where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    // In a real app with many messages, you'd want to use a batched write here
    const updatePromises = [];
    querySnapshot.forEach((d) => {
      updatePromises.push(updateDoc(d.ref, { read: true }));
    });
    await Promise.all(updatePromises);
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
};
