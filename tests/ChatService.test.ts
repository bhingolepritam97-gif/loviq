import { fetchMatchMessages, markMessagesAsRead } from '../src/services/ChatService';
import { apiClient } from '../src/api/client';

jest.mock('../src/api/client', () => ({
  apiClient: jest.fn(),
}));

jest.mock('../src/config/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock_token'),
    },
  },
}));

describe('ChatService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMatchMessages', () => {
    it('should format backend messages correctly', async () => {
      const mockMessages = [
        {
          id: 123,
          content: 'Hello World',
          senderId: 'user-456',
          createdAt: '2023-10-10T12:00:00Z',
          scamWarningTriggered: false,
        }
      ];

      (apiClient as jest.Mock).mockResolvedValue({ success: true, messages: mockMessages });

      const result = await fetchMatchMessages('match-123', null, 20);

      expect(apiClient).toHaveBeenCalledWith('/matches/match-123/messages?limit=20');
      expect(result).toEqual([
        {
          id: '123',
          text: 'Hello World',
          senderId: 'user-456',
          timestamp: '2023-10-10T12:00:00Z',
          read: true,
          scamWarningTriggered: false,
        }
      ]);
    });
  });


  describe('markMessagesAsRead', () => {
    it('should emit socket event to mark messages read', async () => {
      const { socketService } = require('../src/api/socket');
      const mockSocket = { emit: jest.fn() };
      socketService.getSocket = jest.fn().mockReturnValue(mockSocket);
      
      await markMessagesAsRead('match-123', 'my-user-id');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('mark_read', { matchId: 'match-123' });
    });

  });
});
