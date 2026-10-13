'use strict';

/**
 * auth.test.js
 * Tests for POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
 *
 * Strategy: mock mongoose models + jwt so no real MongoDB is needed.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Environment ──────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-32chars-xxxxxxxxxxx';
process.env.JWT_EXPIRES_IN = '24h';
process.env.MONGO_URI = 'mongodb://localhost:27017/cmes_test_stub';

// ── Mock mongoose connect so the app doesn't need a real DB ──────────────────
jest.mock('../config/db', () => jest.fn().mockResolvedValue(undefined));

// ── Mock the User model ──────────────────────────────────────────────────────
jest.mock('../models/User');
const User = require('../models/User');

// ── Mock AuditLog (used by audit.js) ────────────────────────────────────────
jest.mock('../models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

// ── Mock nodemailer ───────────────────────────────────────────────────────────
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));

// ── Import app after mocks ────────────────────────────────────────────────────
const app = require('../server');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeUserDoc(overrides = {}) {
  const base = {
    _id: '64f000000000000000000001',
    name: 'Head Admin',
    email: 'head@cmes.edu',
    role: 'head',
    isActive: true,
    lastLoginAt: null,
    save: jest.fn().mockResolvedValue(true),
    comparePassword: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      _id: '64f000000000000000000001',
      name: 'Head Admin',
      email: 'head@cmes.edu',
      role: 'head',
    }),
  };
  return Object.assign({}, base, overrides);
}

function makeChain(resolvedValue) {
  // Chainable mock for User.findById().select().populate()...
  const chain = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  // Make it thenable so await works
  chain[Symbol.toStringTag] = 'Promise';
  return chain;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and sets httpOnly cookie with valid credentials', async () => {
    const userDoc = makeUserDoc();
    // findOne returns query chain that resolves to userDoc
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'head@cmes.edu', password: 'Head@2024!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('head@cmes.edu');
    expect(res.body.user.role).toBe('head');

    // Cookie must be set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    expect(tokenCookie).toBeTruthy();
    expect(tokenCookie).toMatch(/HttpOnly/i);
  });

  it('returns 401 with invalid password', async () => {
    const userDoc = makeUserDoc({
      comparePassword: jest.fn().mockResolvedValue(false),
    });
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'head@cmes.edu', password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 when user not found', async () => {
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@cmes.edu', password: 'Head@2024!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 for inactive user', async () => {
    // isActive:false means findOne({isActive:true}) returns null
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@cmes.edu', password: 'Head@2024!' });

    expect(res.status).toBe(401);
  });

  it('returns 422 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad' }); // no password, bad email

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 422 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'head@cmes.edu', password: 'short' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      // Cookie should be cleared (empty value or expires in the past)
      if (tokenCookie) {
        expect(tokenCookie).toMatch(/token=;|token=$/i);
      }
    }
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no cookie is set', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 and user object when authenticated', async () => {
    const userId = '64f000000000000000000001';
    const token = jwt.sign(
      { _id: userId, role: 'head' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userDoc = makeUserDoc();
    // Mock User.findById().select().populate().populate() chain
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      // Final thenable
      then: (resolve) => Promise.resolve(userDoc).then(resolve),
      catch: (reject) => Promise.resolve(userDoc).catch(reject),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });

  it('returns 401 with an expired token', async () => {
    const expiredToken = jwt.sign(
      { _id: '64f000000000000000000001', role: 'head' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);

    expect(res.status).toBe(401);
  });

  it('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=this.is.not.valid']);

    expect(res.status).toBe(401);
  });
});
