const { requireAuth } = require('../src/middleware/auth');
const admin = require('../src/config/firebase');
const { User, InviteCode, BannedIdentity } = require('../src/models');

const mockVerifyIdToken = jest.fn();

jest.mock('../src/config/firebase', () => ({
  apps: ['mockApp'],
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  InviteCode: {
    findOne: jest.fn(),
  },
  BannedIdentity: {
    findOne: jest.fn(),
  },
}));


describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      originalUrl: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return 401 if no authorization header is present', async () => {
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing bearer token' });
  });

  test('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid_token';
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
    
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should verify token and populate req.dbUser for existing user', async () => {
    req.headers.authorization = 'Bearer valid_token';
    const mockDecoded = { uid: 'firebase123', phone_number: '+15555555555' };
    mockVerifyIdToken.mockResolvedValue(mockDecoded);

    const mockDbUser = { id: 'uuid123', isBanned: false, save: jest.fn() };
    User.findOne.mockResolvedValue(mockDbUser);

    await requireAuth(req, res, next);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid_token');
    expect(req.firebaseUser).toEqual(mockDecoded);
    expect(req.dbUser).toEqual(mockDbUser);
    expect(next).toHaveBeenCalled();
  });

  test('should return 403 if user is banned', async () => {
    req.headers.authorization = 'Bearer valid_token';
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase123' });

    const mockDbUser = { id: 'uuid123', isBanned: true, banReason: 'Spam', save: jest.fn() };
    User.findOne.mockResolvedValue(mockDbUser);

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'banned',
      reason: 'Spam'
    }));
    expect(next).not.toHaveBeenCalled();
  });
});

export {};
