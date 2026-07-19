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
    profileComplete: u.profileCompleted || false,
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

export const getUserProfile = async (uid) => {
  try {
    const response = await apiClient('/users/me', { cache: true, ttl: 300000 });
    if (response.success && response.user) {
      return mapBackendUserToProfile(response.user);
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from backend REST API:', err.message);
    throw err;
  }
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

      // ── Firestore geohash write (fire-and-forget) ───────────────────────
      // The client-side EmptyStateScreen fallback (profileFeedLogic.js) uses
      // geofire-common geohash queries against the Firestore `profiles` collection.
      // We keep that field in sync here so the fallback always has accurate data.
      if (lat !== undefined && lng !== undefined && uid && db) {
        const geohash = geohashForLocation([lat, lng]);
        setDoc(
          doc(db, 'profiles', uid),
          {
            location: {
              latitude: lat,
              longitude: lng,
              geohash,
            },
            ...(city !== undefined ? { cityName: city } : {}),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) =>
          console.warn('[UserService] Firestore geohash write failed (non-critical):', err.message)
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
