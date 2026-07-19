import { apiClient } from './client';

export const safetyService = {
  reportUser: async (targetId: string, reason: string, details: string = '') => {
    return apiClient('/safety/report', {
      method: 'POST',
      body: { targetId, reason, details },
    });
  },

  blockUser: async (targetId: string) => {
    return apiClient('/safety/block', {
      method: 'POST',
      body: { targetId },
    });
  },
};
