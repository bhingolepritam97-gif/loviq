import { apiClient } from '../api/client';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { geohashForLocation } from 'geofire-common';

function mapBackendUserToProfile(u) {
  if (!u) return null;
  
  // Compute age from birthdate
  let age = 28; // default fallback
  if (u.birthdate) {
    const birth = new Date(u.birthdate);
    age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  // Extract photos URLs in correct order
  let photos = [];
  if (u.photos && Array.isArray(u.photos)) {
    photos = [...u.photos]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(p => p.url);
  }

  // Map genderPreference to interestedIn
  let interestedIn = 'Everyone';
  if (u.genderPreference && u.genderPreference.length > 0) {
    interestedIn = u.genderPreference[0];
  }

  return {
    id: u.id, // the backend database UUID
    firebaseUid: u.firebaseUid,
    name: u.name || '',
    displayName: u.name || '',
    age,
    birthdate: u.birthdate,
    gender: u.gender || '',
    interestedIn,
    bio: u.bio || '',
    interests: u.interests || [],
    location: (u.latitude != null && u.longitude != null) ? {
      latitude: u.latitude,
      longitude: u.longitude,
    } : null,
    photos,
    isPremium: u.isPremium || false,
    profileComplete: Boolean(
      u.profileCompleted === true ||
      u.profile_completed === true ||
      u.profileComplete === true ||
      (u.name && u.gender && ((photos && photos.length > 0) || u.birthdate))
    ),
    isVerified: u.isVerified || false,
    cityName: u.cityName || '',
    isActive: u.isActive !== undefined ? u.isActive : (u.is_active !== undefined ? u.is_active : true),
    hideDistance: u.hideDistance !== undefined ? u.hideDistance : (u.hide_distance !== undefined ? u.hide_distance : false),
    womenMessageFirstEnabled: u.womenMessageFirstEnabled !== undefined ? u.womenMessageFirstEnabled : (u.women_message_first_enabled !== undefined ? u.women_message_first_enabled : false),
    height: u.height || null,
    exercise: u.exercise || null,
    drinking: u.drinking || null,
    pets: u.pets || null,
    starSign: u.starSign || u.star_sign || null,
    anthemSong: u.anthemSong || u.anthem_song || null,
    anthemArtist: u.anthemArtist || u.anthem_artist || null,
    // Discovery filter preferences (persisted to backend)
    ageMin: u.ageMin ?? u.age_min ?? 18,
    ageMax: u.ageMax ?? u.age_max ?? 65,
    maxDistanceKm: u.maxDistanceKm ?? u.max_distance_km ?? 80.5,
    // Derived convenience fields for components that use legacy naming
    distance_range: Math.round((u.maxDistanceKm ?? u.max_distance_km ?? 80.5) / 1.60934),
    age_range: [u.ageMin ?? u.age_min ?? 18, u.ageMax ?? u.age_max ?? 65],
    // Profile excellence score (0-100)
    profileScore: u.profileScore ?? u.profile_score ?? null,
    verifiedOnly: u.verifiedOnly ?? u.verified_only ?? false,
  };
}

// ── Firestore users/{uid} helpers ─────────────────────────────────────────
// These write to the spec-required users/{uid} collection (separate from the
// proximity-query profiles/{uid} collection already synced by updateUserProfile).

/**
 * ensureUserDocument — called once on every login via onAuthStateChanged.
 * Creates users/{uid} with profileCompleted=false if it doesn't exist yet.
 * Uses merge:true so it never overwrites a fully-filled document.
 */
export const ensureUserDocument = async (uid: string, firebaseUser: any): Promise<void> => {
  if (!uid || !db) return;
  try {
    const { getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // First login — seed the document
      await setDoc(docRef, {
        uid,
        email: firebaseUser?.email || '',
        phone: firebaseUser?.phoneNumber || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleted: false,
        verificationStatus: 'pending',
        online: true,
      });
      console.log('[UserService] ✅ Firestore users/' + uid + ' created (first login).');
    } else {
      // Existing user — just mark them online
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(docRef, { online: true, updatedAt: new Date().toISOString() });
      console.log('[UserService] ✅ Firestore users/' + uid + ' found (existing user). online=true.');
    }
  } catch (err: any) {
    // Non-critical — never block the auth flow
    console.warn('[UserService] ensureUserDocument failed (non-critical):', err.message);
  }
};

/**
 * syncUserDocumentOnComplete — called from PhotoUploadScreen after successful profile creation.
 * Writes all spec-required fields to users/{uid} and sets profileCompleted=true.
 */
export const syncUserDocumentOnComplete = async (uid: string, profile: any): Promise<void> => {
  if (!uid || !db) return;
  try {
    const payload: any = {
      uid,
      firstName: profile.name || profile.firstName || '',
      birthday: profile.birthdate || '',
      gender: profile.gender || '',
      interestedIn: profile.interestedIn || profile.genderPreference?.[0] || 'Everyone',
      bio: profile.bio || '',
      photos: profile.photos || [],
      interests: profile.interests || [],
      preferences: {
        ageMin: profile.ageMin ?? 18,
        ageMax: profile.ageMax ?? 65,
        maxDistanceKm: profile.maxDistanceKm ?? 80.5,
        interestedIn: profile.interestedIn || 'Everyone',
      },
      profileCompleted: true,
      verificationStatus: 'pending',
      online: true,
      updatedAt: new Date().toISOString(),
    };

    if (profile.location?.latitude != null) {
      payload.location = {
        latitude: profile.location.latitude,
        longitude: profile.location.longitude,
        cityName: profile.location.cityName || profile.cityName || '',
      };
    } else if (profile.latitude != null) {
      payload.location = {
        latitude: profile.latitude,
        longitude: profile.longitude,
        cityName: profile.cityName || '',
      };
    }

    await setDoc(doc(db, 'users', uid), payload, { merge: true });
    console.log('[UserService] ✅ Firestore users/' + uid + ' synced — profileCompleted=true.');
    console.log('[UserService] 🎉 Profile Completed — all onboarding fields written to Firestore.');
  } catch (err: any) {
    // Non-critical — profile is already saved in REST backend
    console.warn('[UserService] syncUserDocumentOnComplete failed (non-critical):', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export const getUserProfile = async (uid: string) => {
  try {
    const response = await apiClient('/users/me', { cache: true, ttl: 300000 });
    if (response?.success && response?.user) {
      return mapBackendUserToProfile(response.user);
    }
  } catch (err: any) {
    console.warn('[UserService] REST /users/me fetch failed, checking Firestore fallback for uid ' + uid + ':', err.message);
  }

  // Fallback: Fetch directly from Firestore users/{uid}
  if (uid && db) {
    try {
      const { getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const photos = data.photos || [];
        const isComplete = Boolean(
          data.profileCompleted === true ||
          data.profileComplete === true ||
          (data.firstName || data.name) && data.gender && (photos.length > 0 || data.birthday || data.birthdate)
        );
        return {
          id: uid,
          firebaseUid: uid,
          name: data.firstName || data.name || '',
          displayName: data.firstName || data.name || '',
          gender: data.gender || '',
          interestedIn: data.interestedIn || 'Everyone',
          bio: data.bio || '',
          interests: data.interests || [],
          photos: photos,
          isPremium: data.isPremium || false,
          profileComplete: isComplete,
          isVerified: data.verificationStatus === 'approved',
          location: data.location || null,
        };
      }
    } catch (fsErr: any) {
      console.warn('[UserService] Firestore fallback failed:', fsErr.message);
    }
  }

  return null;
};

export const fetchUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const response = await apiClient(`/users/${uid}`, { cache: true, ttl: 300000 });
    if (response.success && response.user) {
      return mapBackendUserToProfile(response.user);
    }
    return null;
  } catch (err) {
    console.warn('[UserService] Error fetching user profile by ID:', err.message);
    return null;
  }
};

export const createUserProfile = async (uid, data) => {
  return await updateUserProfile(uid, data);
};

export const updateUserProfile = async (uid, data) => {
  if (!uid) return null;
  
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.displayName !== undefined) payload.name = data.displayName;
  
  if (data.birthdate !== undefined) {
    payload.birthdate = data.birthdate;
  } else if (data.age !== undefined) {
    const year = new Date().getFullYear() - data.age;
    payload.birthdate = `${year}-01-01`;
  }
  
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.interestedIn !== undefined) {
    payload.genderPreference = [data.interestedIn];
  }
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.interests !== undefined) payload.interests = data.interests;
  if (data.photos !== undefined) payload.photos = data.photos;
  if (data.isPremium !== undefined) payload.isPremium = data.isPremium;
  if (data.isVerified !== undefined) payload.isVerified = data.isVerified;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.hideDistance !== undefined) payload.hideDistance = data.hideDistance;
  if (data.verifiedOnly !== undefined) payload.verifiedOnly = data.verifiedOnly;
  if (data.height !== undefined) payload.height = data.height;
  if (data.exercise !== undefined) payload.exercise = data.exercise;
  if (data.drinking !== undefined) payload.drinking = data.drinking;
  if (data.pets !== undefined) payload.pets = data.pets;
  if (data.starSign !== undefined) payload.starSign = data.starSign;
  if (data.anthemSong !== undefined) payload.anthemSong = data.anthemSong;
  if (data.anthemArtist !== undefined) payload.anthemArtist = data.anthemArtist;
  // Profile excellence score (calculated client-side, stored for analytics/future ranking)
  if (data.profileScore !== undefined) payload.profileScore = data.profileScore;
  // Discovery filter preferences
  if (data.ageMin !== undefined) payload.ageMin = data.ageMin;
  if (data.ageMax !== undefined) payload.ageMax = data.ageMax;
  if (data.maxDistanceKm !== undefined) payload.maxDistanceKm = data.maxDistanceKm;
  // Legacy field names used by FiltersScreen — translate them
  if (data.distance_range !== undefined) payload.maxDistanceKm = data.distance_range * 1.60934;
  if (data.age_range !== undefined) {
    payload.ageMin = data.age_range[0];
    payload.ageMax = data.age_range[1];
  }
  
  const lat = data.location?.latitude !== undefined ? data.location.latitude : data.latitude;
  const lng = data.location?.longitude !== undefined ? data.location.longitude : data.longitude;
  if (lat !== undefined && lng !== undefined) {
    payload.latitude = lat;
    payload.longitude = lng;
  }
  
  const city = data.location?.cityName !== undefined ? data.location.cityName : data.cityName;
  if (city !== undefined) {
    payload.cityName = city;
  }
  
  try {
    const response = await apiClient('/users/me', {
      method: 'PATCH',
      body: payload
    });
    if (response.success && response.user) {
      const mapped = mapBackendUserToProfile(response.user);

      // ── Firestore profile sync (fire-and-forget) ──────────────────────
      // profiles/{uid} is queried by the proximity feed fallback. We always
      // write core fields so the doc exists even if location is not granted.
      if (uid && db) {
        const firestorePayload: any = {
          name: mapped.name || '',
          photos: mapped.photos || [],
          profileCompleted: mapped.profileComplete || false,
          updatedAt: new Date().toISOString(),
        };
        if (lat !== undefined && lng !== undefined) {
          const geohash = geohashForLocation([lat, lng]);
          firestorePayload.location = { latitude: lat, longitude: lng, geohash };
          if (city !== undefined) firestorePayload.cityName = city;
        }
        console.log('[UserService] Writing Firestore profiles/', uid, 'fields:', Object.keys(firestorePayload));
        setDoc(doc(db, 'profiles', uid), firestorePayload, { merge: true }).catch((err) =>
          console.warn('[UserService] Firestore profile sync failed (non-critical):', err.message)
        );
      }

      return mapped;
    }
    return null;
  } catch (err) {
    console.warn('Error updating user profile in backend:', err.message);
    return null;
  }
};

export const upgradeToPremium = async (uid) => {
  try {
    const response = await apiClient('/users/me', {
      method: 'PATCH',
      body: { isPremium: true }
    });
    return response.success;
  } catch (err) {
    console.error('Error upgrading to premium in backend:', err);
    return false;
  }
};

/**
 * Registers an Expo push token against this user in the backend.
 * Called once after login when the token is retrieved from the OS.
 */
export const savePushToken = async (token) => {
  if (!token) return false;
  try {
    const response = await apiClient('/users/me/push-token', {
      method: 'PATCH',
      body: { token },
    });
    console.log('[UserService] Push token saved to backend:', response.success);
    return response.success;
  } catch (err) {
    // Non-critical — don't crash the app if this fails
    console.warn('[UserService] Failed to save push token (non-critical):', err.message);
    return false;
  }
};

export const verifyUser = async (selfieUrl) => {
  try {
    const response = await apiClient('/users/me/verify-selfie', {
      method: 'POST',
      body: { selfieUrl }
    });
    return response.success;
  } catch (err) {
    console.error('Error verifying user in backend:', err);
    return false;
  }
};

export const blockUser = async (myUid, blockedId) => {
  try {
    const response = await apiClient(`/users/${myUid}/block`, {
      method: 'POST',
      body: { blockedId }
    });
    return response.success;
  } catch (err) {
    console.error('Error blocking user in backend:', err);
    return false;
  }
};

export const getBlockedUsers = async (myUid) => {
  try {
    const response = await apiClient(`/users/${myUid}/blocks`);
    if (response.success && response.blocks) {
      return response.blocks.map(b => ({
        id: b.blockedId,
        name: b.blocked?.name || 'Unknown',
        phone: b.blocked?.phone || 'No phone',
      }));
    }
    return [];
  } catch (err) {
    console.error('Error fetching blocked users:', err);
    return [];
  }
};

export const unblockUser = async (myUid, blockedId) => {
  try {
    const response = await apiClient(`/users/${myUid}/block/${blockedId}`, {
      method: 'DELETE'
    });
    return response.success;
  } catch (err) {
    console.error('Error unblocking user:', err);
    return false;
  }
};

export const reportUser = async (myUid, reportedId, reason) => {
  try {
    const response = await apiClient(`/users/${myUid}/report`, {
      method: 'POST',
      body: { reportedId, reason }
    });
    return response.success;
  } catch (err) {
    console.error('Error reporting user in backend:', err);
    return false;
  }
};

export const unmatchUser = async (myUid, matchId) => {
  try {
    // Note: matchId must be the UUID of the Match record, not the target user's UUID.
    const response = await apiClient(`/matches/${matchId}/unmatch`, {
      method: 'POST'
    });
    return response.success;
  } catch (err) {
    console.error('Error unmatching user in backend:', err);
    return false;
  }
};

export const fetchAiSuggestions = async ({ type, text, interests, promptQuestion }) => {
  try {
    const response = await apiClient('/users/me/ai-suggestions', {
      method: 'POST',
      body: { type, text, interests, promptQuestion }
    });
    return response.success ? response.suggestions : [];
  } catch (err) {
    console.error('[UserService] Error fetching AI suggestions:', err);
    return [];
  }
};

export const cancelSubscription = async () => {
  try {
    const response = await apiClient('/billing/cancel', { method: 'POST' });
    return response;
  } catch (err) {
    console.warn('[UserService] Failed to cancel subscription:', err.message);
    throw err;
  }
};

export const getProfileScore = async () => {
  try {
    const response = await apiClient('/users/me/profile-score');
    return response;
  } catch (err) {
    console.warn('[UserService] Failed to get profile score:', err.message);
    throw err;
  }
};

export const travelToLocation = async (latitude, longitude) => {
  try {
    const response = await apiClient('/users/me/travel', {
      method: 'POST',
      body: { latitude, longitude }
    });
    return response;
  } catch (err) {
    console.warn('[UserService] Failed to update travel location:', err.message);
    throw err;
  }
};

export const submitAppeal = async (explanation) => {
  try {
    const response = await apiClient('/users/me/appeal', {
      method: 'POST',
      body: { explanation }
    });
    return response;
  } catch (err) {
    console.warn('[UserService] Failed to submit suspension appeal:', err.message);
    throw err;
  }
};
