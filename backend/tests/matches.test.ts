const request = require('supertest');
const express = require('express');
const { Match, User, Message } = require('../src/models');
const matchesController = require('../src/controllers/matchesController');

jest.mock('../src/models', () => ({
  Match: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Message: {
    findOne: jest.fn(),
    create: jest.fn(),
  }
}));

const app = express();
app.use(express.json());

// Mock auth middleware for route testing
app.use((req, res, next) => {
  req.dbUser = { id: 'user1' };
  next();
});

app.post('/matches/:id/messages', matchesController.sendMessage);

describe('Matches Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    test('should prevent messaging if match is not active', async () => {
      Match.findByPk.mockResolvedValue({
        id: 'match1',
        userAId: 'user1',
        userBId: 'user2',
        status: 'unmatched',
      });

      const response = await request(app)
        .post('/matches/match1/messages')
        .send({ content: 'Hello' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ success: false, error: 'Match is not active' });
    });

    test('should block men from messaging first in restricted mode', async () => {
      Match.findByPk.mockResolvedValue({
        id: 'match1',
        userAId: 'user1', // Man
        userBId: 'user2', // Woman
        status: 'active',
        restrictedMode: true,
        firstMessageSent: false,
        onlyUserIdCanMessageFirst: 'user2',
      });

      const response = await request(app)
        .post('/matches/match1/messages')
        .send({ content: 'Hey!' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ 
        success: false, 
        error: 'Only the matching woman can send the first message' 
      });
    });

    test('should detect scam keywords and flag for review', async () => {
      const mockMatch = {
        id: 'match1',
        userAId: 'user1',
        userBId: 'user2',
        status: 'active',
        update: jest.fn()
      };
      Match.findByPk.mockResolvedValue(mockMatch);
      Message.create.mockResolvedValue({ id: 'msg1', content: 'send crypto', scamWarningTriggered: true });

      const response = await request(app)
        .post('/matches/match1/messages')
        .send({ content: 'Hey send crypto to my wallet' });

      expect(response.status).toBe(201);
      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        scamWarningTriggered: true
      }));
      expect(response.body.scamWarningTriggered).toBe(true);
    });
  });
});

export {};
