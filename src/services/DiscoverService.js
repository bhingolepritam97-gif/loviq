import { apiClient } from '../api/client';

export const getPotentialMatches = async (currentUserUid, userProfile) => {
  if (!currentUserUid || !userProfile) return [];
  try {
    const data = await apiClient('/deck');
    return data.deck || [];
  } catch (err) {
    console.error('Error fetching deck from API:', err);
    return [];
  }
};

export const recordSwipe = async (currentUserUid, targetUserUid, direction, targetUserProfile) => {
  if (!currentUserUid || !targetUserUid) return null;
  
  // Mapping 'right' -> 'like', 'left' -> 'pass' to match backend expected enums
  const action = direction === 'right' ? 'like' : (direction === 'left' ? 'pass' : direction);
  
  try {
    const data = await apiClient('/swipes', {
      method: 'POST',
      body: { swipedId: targetUserUid, direction: action },
    });
    
    if (data.match) {
      // It's a match!
      return {
        id: data.match.id,
        matchedUser: { id: targetUserUid, ...targetUserProfile }
      };
    }
  } catch (err) {
    console.error('Error recording swipe via API:', err);
  }
  
  return null;
};
