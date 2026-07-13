import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from Firestore (possibly offline):', err.message);
    return null;
  }
};

export const createUserProfile = async (uid, data) => {
  if (!uid) return;
  try {
    const docRef = doc(db, 'profiles', uid);
    const defaults = {
      eloScore: 1500,
      swipeStats: { totalSwipes: 0, rightSwipes: 0 },
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, { ...defaults, ...data }, { merge: true });
  } catch (err) {
    console.warn('Error creating user profile in Firestore:', err.message);
  }
};

export const updateUserProfile = async (uid, data) => {
  if (!uid) return;
  try {
    const docRef = doc(db, 'profiles', uid);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Error updating user profile in Firestore:', err.message);
  }
};

export const upgradeToPremium = async (uid) => {
  if (!uid) return false;
  try {
    const docRef = doc(db, 'profiles', uid);
    await updateDoc(docRef, { 
      isPremium: true,
      premiumSince: new Date().toISOString() 
    });
    return true;
  } catch (err) {
    console.error('Error upgrading to premium:', err);
    return false;
  }
};

export const blockUser = async (myUid, blockedId) => {
  if (!myUid || !blockedId) return false;
  try {
    const docRef = doc(db, 'profiles', myUid);
    await updateDoc(docRef, {
      blockedUsers: arrayUnion(blockedId)
    });
    return true;
  } catch (err) {
    console.error('Error blocking user in Firestore:', err);
    return false;
  }
};

export const reportUser = async (myUid, reportedId, reason) => {
  if (!myUid || !reportedId || !reason) return false;
  try {
    const reportRef = doc(db, 'reports', `${myUid}_${reportedId}`);
    await setDoc(reportRef, {
      reporterId: myUid,
      reportedId: reportedId,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    await blockUser(myUid, reportedId);
    return true;
  } catch (err) {
    console.error('Error reporting user in Firestore:', err);
    return false;
  }
};

export const verifyUser = async (uid) => {
  if (!uid) return false;
  try {
    const docRef = doc(db, 'profiles', uid);
    await updateDoc(docRef, {
      isVerified: true,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Error verifying user in Firestore:', err);
    return false;
  }
};

export const unmatchUser = async (myUid, matchUid) => {
  if (!myUid || !matchUid) return false;
  try {
    const matchId = [myUid, matchUid].sort().join('_');
    const matchRef = doc(db, 'matches', matchId);
    await deleteDoc(matchRef);
    
    // Also block the user to prevent them from showing up again
    await blockUser(myUid, matchUid);
    return true;
  } catch (err) {
    console.error('Error unmatching user in Firestore:', err);
    return false;
  }
};
