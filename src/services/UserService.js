import { apiClient } from '../api/client';

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const data = await apiClient(`/users/${uid}`);
    return data.user;
  } catch (err) {
    console.error('Error fetching user profile from API:', err);
    return null;
  }
};

export const createUserProfile = async (uid, data) => {
  if (!uid) return;
  // According to backend controller, profile shell is auto-created on first auth.
  // We complete it via PATCH /users/:id. So this can just delegate to updateUserProfile.
  return updateUserProfile(uid, data);
};

export const updateUserProfile = async (uid, data) => {
  if (!uid) return;
  try {
    await apiClient(`/users/${uid}`, {
      method: 'PATCH',
      body: data,
    });
  } catch (err) {
    console.error('Error updating user profile via API:', err);
  }
};
export const blockUser = async (myUid, blockedId) => {
  if (!myUid || !blockedId) return false;
  try {
    await apiClient(`/users/${myUid}/block`, {
      method: 'POST',
      body: { blockedId },
    });
    return true;
  } catch (err) {
    console.error('Error blocking user:', err);
    return false;
  }
};

export const reportUser = async (myUid, reportedId, reason) => {
  if (!myUid || !reportedId || !reason) return false;
  try {
    await apiClient(`/users/${myUid}/report`, {
      method: 'POST',
      body: { reportedId, reason },
    });
    return true;
  } catch (err) {
    console.error('Error reporting user:', err);
    return false;
  }
};
