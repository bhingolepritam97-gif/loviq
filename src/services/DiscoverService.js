import { apiClient } from '../api/client';

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
    distance: u.distance_meters ? (u.distance_meters / 1609.34) : undefined, // Convert meters to miles
    cityName: u.cityName || '',
  };
}

export const getPotentialMatches = async (currentUserUid, userProfile, defaultRadius = 50) => {
  if (!currentUserUid || !userProfile) return [];
  try {
    const radiusInMiles = userProfile.distance_range || defaultRadius;
    const maxDistanceKm = radiusInMiles * 1.60934;
    
    const response = await apiClient(`/deck?limit=30&maxDistanceKm=${maxDistanceKm}`);
    if (response.success && Array.isArray(response.candidates)) {
      return response.candidates.map(mapBackendUserToProfile).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('Error fetching potential matches from backend:', err.message);
    return [];
  }
};

export const subscribeToPotentialMatches = (currentUserUid, userProfile, callback, defaultRadius = 50) => {
  if (!currentUserUid || !userProfile) {
    callback([]);
    return () => {};
  }
  
  let active = true;
  getPotentialMatches(currentUserUid, userProfile, defaultRadius).then(res => {
    if (active) callback(res);
  });
  
  // Return simple no-op unsubscribe since we fetch on-demand over HTTP
  return () => {
    active = false;
  };
};

export const recordSwipe = async (currentUserUid, targetUserUid, direction, targetUserProfile, message = null) => {
  if (!currentUserUid || !targetUserUid) return null;
  
  const action = direction === 'right' ? 'like' : (direction === 'left' ? 'pass' : 'superlike');
  
  try {
    const response = await apiClient('/swipes', {
      method: 'POST',
      body: {
        swipedId: targetUserUid,
        direction: action
      }
    });
    
    if (response.success && response.match) {
      return {
        id: response.match.id,
        matchedUser: mapBackendUserToProfile({ id: targetUserUid, ...targetUserProfile })
      };
    }
    return null;
  } catch (err) {
    console.warn('Error recording swipe in backend:', err.message);
    return null;
  }
};
