import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, limit, orderBy, startAt, endAt, addDoc } from 'firebase/firestore';
import * as geofire from 'geofire-common';

import { rankCandidates, calculateEloUpdate } from './AlgorithmService';

export const getPotentialMatches = async (currentUserUid, userProfile, defaultRadius = 50) => {
  if (!currentUserUid || !userProfile) return [];
  try {
    const pool = [];
    
    // Extract user preferences
    const radiusInMiles = userProfile.distance_range || defaultRadius;
    const globalMode = userProfile.global_mode || false;
    const [minAge, maxAge] = userProfile.age_range || [18, 100];
    const interestedIn = userProfile.interestedIn || 'Everyone';
    
    // If the user has location enabled, use geohashing to find nearby users
    if (!globalMode && userProfile.location?.latitude && userProfile.location?.longitude) {
      const center = [userProfile.location.latitude, userProfile.location.longitude];
      const radiusInM = radiusInMiles * 1609.34;
      const bounds = geofire.geohashQueryBounds(center, radiusInM);
      const profilesRef = collection(db, 'profiles');
      
      const promises = [];
      for (const b of bounds) {
        const q = query(
          profilesRef,
          orderBy('location.geohash'),
          startAt(b[0]),
          endAt(b[1])
        );
        promises.push(getDocs(q));
      }
      
      const snapshots = await Promise.all(promises);
      
      snapshots.forEach((snap) => {
        snap.forEach((doc) => {
          if (doc.id !== currentUserUid && !userProfile.blockedUsers?.includes(doc.id)) {
            const data = doc.data();
            
            // Client-side filtering: Age & Gender
            const passesAge = data.age >= minAge && data.age <= maxAge;
            const passesGender = interestedIn === 'Everyone' || data.gender === interestedIn;
            
            if (passesAge && passesGender && data.location?.latitude && data.location?.longitude) {
              const distanceInKm = geofire.distanceBetween(
                [data.location.latitude, data.location.longitude], 
                center
              );
              const distanceInMiles = distanceInKm / 1.60934;
              
              if (distanceInMiles <= radiusInMiles) {
                pool.push({ id: doc.id, ...data, distance: distanceInMiles });
              }
            }
          }
        });
      });
      
    } else {
      // Fallback or Global mode
      const profilesRef = collection(db, 'profiles');
      // In a real app we'd query by age/gender to avoid downloading all profiles, 
      // but firestore limitations require composite indexes. Doing client-side for MVP.
      const q = query(profilesRef, where('__name__', '!=', currentUserUid), limit(150));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const passesAge = data.age >= minAge && data.age <= maxAge;
        const passesGender = interestedIn === 'Everyone' || data.gender === interestedIn;
        
        if (!userProfile.blockedUsers?.includes(doc.id) && passesAge && passesGender) {
          pool.push({ id: doc.id, ...data });
        }
      });
    }
    
    // Rank the candidates based on ELO proximity and business logic modifiers
    const rankedDeck = rankCandidates(userProfile, pool);
    
    // Sort by distance first (if location exists), then by ELO score
    if (userProfile.location) {
       rankedDeck.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    }
    
    // Return top 25
    return rankedDeck.slice(0, 25);
  } catch (err) {
    console.error('Error fetching deck from Firestore:', err);
    return [];
  }
};

export const recordSwipe = async (currentUserUid, targetUserUid, direction, targetUserProfile, message = null) => {
  if (!currentUserUid || !targetUserUid) return null;
  
  const action = direction === 'right' ? 'like' : (direction === 'left' ? 'pass' : (direction === 'up' ? 'super_like' : direction));
  
  try {
    // 1. Fetch swiper profile to get their ELO and swipeStats
    const swiperRef = doc(db, 'profiles', currentUserUid);
    const swiperSnap = await getDoc(swiperRef);
    const swiperData = swiperSnap.exists() ? swiperSnap.data() : { eloScore: 1500, swipeStats: { totalSwipes: 0, rightSwipes: 0 }, isPremium: false };
    
    const today = new Date().toISOString().split('T')[0];
    const isSuperLike = action === 'super_like';
    if (isSuperLike) {
      const superLikesCount = swiperData.superLikesCount ?? (swiperData.isPremium ? 5 : 1);
      if (superLikesCount <= 0) {
        return { limitReached: true, type: 'super_like' };
      }
    } else if (!swiperData.isPremium) {
      const lastSwipeDate = swiperData.lastSwipeDate || today;
      let swipesToday = swiperData.swipesToday || 0;
      if (lastSwipeDate !== today) swipesToday = 0;
      if (swipesToday >= 50) return { limitReached: true };
    }
    
    // 2. Determine outcome and calculate new ELO for target
    const outcome = action === 'like' || action === 'super_like' ? 1 : 0;
    const swiperElo = swiperData.eloScore || 1500;
    const targetElo = targetUserProfile?.eloScore || 1500;
    const newTargetElo = calculateEloUpdate(targetElo, swiperElo, outcome);

    // 3. Update target's ELO
    const targetRef = doc(db, 'profiles', targetUserUid);
    await updateDoc(targetRef, { eloScore: newTargetElo }).catch((err) => {
      console.error('Failed to update target ELO:', err);
    });

    // 4. Update swiper's swipeStats
    const currentStats = swiperData.swipeStats || { totalSwipes: 0, rightSwipes: 0 };
    const lastSwipeDate = swiperData.lastSwipeDate || today;
    let newSwipesToday = (lastSwipeDate === today ? (swiperData.swipesToday || 0) : 0) + 1;

    const updates = {
      swipeStats: {
        totalSwipes: currentStats.totalSwipes + 1,
        rightSwipes: currentStats.rightSwipes + outcome,
      },
      swipesToday: newSwipesToday,
      lastSwipeDate: today
    };

    if (isSuperLike) {
      const superLikesCount = swiperData.superLikesCount ?? (swiperData.isPremium ? 5 : 1);
      updates.superLikesCount = Math.max(0, superLikesCount - 1);
    }

    await updateDoc(swiperRef, updates).catch((err) => {
      console.error('Failed to update swiper stats:', err);
    });

    // Record the swipe
    const swipePayload = {
      from: currentUserUid,
      to: targetUserUid,
      action: action,
      timestamp: new Date().toISOString()
    };
    if (message) swipePayload.message = message;
    
    const swipeRef = doc(db, 'swipes', `${currentUserUid}_${targetUserUid}`);
    await setDoc(swipeRef, swipePayload);
    
    if (action === 'like' || action === 'super_like') {
      // Check for mutual like
      const theirSwipeRef = doc(db, 'swipes', `${targetUserUid}_${currentUserUid}`);
      const theirSwipeSnap = await getDoc(theirSwipeRef);
      
      if (theirSwipeSnap.exists() && (theirSwipeSnap.data().action === 'like' || theirSwipeSnap.data().action === 'super_like')) {
        // It's a match! Create a match document
        const matchId = [currentUserUid, targetUserUid].sort().join('_');
        const matchRef = doc(db, 'matches', matchId);
        
        await setDoc(matchRef, {
          users: [currentUserUid, targetUserUid],
          matchedAt: new Date().toISOString(),
          lastMessageTime: new Date().toISOString(),
        });
        
        // Inject messages if any
        const theirMessage = theirSwipeSnap.data().message;
        const messagesRef = collection(db, 'matches', matchId, 'messages');
        
        if (theirMessage) {
           await addDoc(messagesRef, { senderId: targetUserUid, content: theirMessage, createdAt: theirSwipeSnap.data().timestamp, read: false });
        }
        if (message) {
           await addDoc(messagesRef, { senderId: currentUserUid, content: message, createdAt: swipePayload.timestamp, read: false });
        }
        
        return {
          id: matchId,
          matchedUser: { id: targetUserUid, ...targetUserProfile }
        };
      }
    }
  } catch (err) {
    console.error('Error recording swipe in Firestore:', err);
  }
  
  return null;
};
