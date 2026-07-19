import { apiClient } from '../api/client';

export const getTrustedContacts = async () => {
  try {
    const res = await apiClient('/safety/trusted-contacts');
    if (res.success && Array.isArray(res.contacts)) {
      return res.contacts;
    }
    return [];
  } catch (err) {
    console.error('[SafetyService] Error fetching trusted contacts:', err.message);
    return [];
  }
};

export const addTrustedContact = async (name, phone) => {
  try {
    const res = await apiClient('/safety/trusted-contacts', {
      method: 'POST',
      body: {
        contactName: name,
        contactPhone: phone,
      },
    });
    return res.success ? res.contact : null;
  } catch (err) {
    console.error('[SafetyService] Error adding trusted contact:', err.message);
    throw err;
  }
};

export const shareDate = async (matchId, location, time = null) => {
  try {
    const res = await apiClient('/safety/share-date', {
      method: 'POST',
      body: {
        matchId,
        location,
        plannedTime: time,
      },
    });
    return res.success ? { dateShare: res.dateShare, shareUrl: res.shareUrl } : null;
  } catch (err) {
    console.error('[SafetyService] Error sharing date:', err.message);
    throw err;
  }
};

export const triggerSos = async (lat = null, lng = null) => {
  try {
    const res = await apiClient('/safety/sos', {
      method: 'POST',
      body: {
        lat,
        lng,
      },
    });
    return res.success;
  } catch (err) {
    console.error('[SafetyService] Error triggering SOS:', err.message);
    throw err;
  }
};
