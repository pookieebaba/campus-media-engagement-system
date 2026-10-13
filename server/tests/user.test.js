'use strict';

/**
 * user.test.js
 * Tests for listUsers pagination, bulkImport CSV, activate/deactivate.
 * All mongoose models are mocked — no live DB required.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-32chars-xxxxxxxxxxx';
process.env.JWT_EXPIRES_IN = '24h';
process.env.MONGO_URI = 'mongodb://localhost:27017/cmes_test_stub';

jest.mock('../config/db', () => jest.fn().mockResolvedValue(undefined));
jest.mock('../models/AuditLog', () => ({ create: jest.fn().mockResolvedValue({}) }));

jest.mock('../models/User');
jest.mock('../models/Block');

const User = require('../models/User');
const Block = require('../models/Block');

const app = require('../server');

// ── Tokens ────────────────────────────────────────────────────────────────────
const headId    = '64f000000000000000000001';
const facultyId = '64f000000000000000000002';
const studentId = '64f000000000000000000003';

function makeToken(id, role) {
  return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const headToken    = makeToken(headId,    'head');
const facultyToken = makeToken(facultyId, 'faculty');
const studentToken = makeToken(studentId, 'student');

// ── listUsers ─────────────────────────────────────────────────────────────────
describe('GET /api/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('HEAD can list users (200)', async () => {
    const mockUsers = [
      { _id: headId,    name: 'Head',    email: 'head@cmes.edu',    role: 'head' },
      { _id: facultyId, name: 'Faculty', email: 'faculty@cmes.edu', role: 'faculty' },
    ];

    User.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort:    jest.fn().mockReturnThis(),
      skip:    jest.fn().mockReturnThis(),
      limit:   jest.fn().mockResolvedValue(mockUsers),
    });
    User.countDocuments = jest.fn().mockResolvedValue(2);

    const res = await request(app)
      .get('/api/users')
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('total', 2);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('pages', 1);
  });

  it('Applies pagination correctly', async () => {
    const mockUsers = [{ _id: '64f000000000000000000005', name: 'Student5', email: 's5@cmes.edu', role: 'student' }];

    User.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort:    jest.fn().mockReturnThis(),
      skip:    jest.fn().mockReturnThis(),
      limit:   jest.fn().mockResolvedValue(mockUsers),
    });
    User.countDocuments = jest.fn().mockResolvedValue(50);

    const res = await request(app)
      .get('/api/users?page=2&limit=10')
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pages).toBe(5); // 50 / 10 = 5 pages
  });

  it('Faculty cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Cookie', [`token=${facultyToken}`]);

    expect(res.status).toBe(403);
  });

  it('Student cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Cookie', [`token=${studentToken}`]);

    expect(res.status).toBe(403);
  });

  it('Returns 401 without authentication', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

// ── bulkImport ────────────────────────────────────────────────────────────────
describe('POST /api/users/bulk-import', () => {
  beforeEach(() => jest.clearAllMocks());

  const validCSV = [
    'name,email,studentId,blockCode,supervisorEmail',
    'Alice Smith,alice@student.cmes.edu,ET2024001,ET,',
    'Bob Jones,bob@student.cmes.edu,ET2024002,ET,',
  ].join('\n');

  const invalidCSV = [
    'name,email,studentId,blockCode',
    'Bad,notanemail,AB,UNKNOWNBLOCK',
  ].join('\n');

  it('HEAD can bulk import valid rows (200, all created)', async () => {
    Block.findOne = jest.fn().mockResolvedValue({
      _id: '64b000000000000000000001',
      code: 'ET',
      isActive: true,
    });
    User.findOne = jest.fn().mockResolvedValue(null); // no supervisor lookup
    User.create = jest.fn().mockResolvedValue({ _id: '64u000000000000000000001', name: 'Alice Smith' });

    const res = await request(app)
      .post('/api/users/bulk-import')
      .set('Cookie', [`token=${headToken}`])
      .attach('file', Buffer.from(validCSV), { filename: 'students.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('created');
    expect(res.body.created).toBe(2);
    expect(res.body.failed).toBe(0);
    expect(res.body.errors).toHaveLength(0);
  });

  it('Invalid rows are returned in errors array', async () => {
    Block.findOne = jest.fn().mockResolvedValue(null); // block not found

    const res = await request(app)
      .post('/api/users/bulk-import')
      .set('Cookie', [`token=${headToken}`])
      .attach('file', Buffer.from(invalidCSV), { filename: 'bad.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.failed).toBeGreaterThan(0);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('Returns 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/users/bulk-import')
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no csv file/i);
  });

  it('Faculty cannot bulk import (403)', async () => {
    const res = await request(app)
      .post('/api/users/bulk-import')
      .set('Cookie', [`token=${facultyToken}`])
      .attach('file', Buffer.from(validCSV), { filename: 'students.csv', contentType: 'text/csv' });

    expect(res.status).toBe(403);
  });
});

// ── activate/deactivate ───────────────────────────────────────────────────────
describe('User activate / deactivate', () => {
  const targetId = '64f000000000000000000099';

  beforeEach(() => jest.clearAllMocks());

  it('HEAD can deactivate a user (200)', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: targetId,
      name: 'Some User',
      isActive: false,
    });

    const res = await request(app)
      .patch(`/api/users/${targetId}/deactivate`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('HEAD can activate a user (200)', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: targetId,
      name: 'Some User',
      isActive: true,
    });

    const res = await request(app)
      .patch(`/api/users/${targetId}/activate`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/activated/i);
  });

  it('HEAD cannot deactivate themselves (400)', async () => {
    const res = await request(app)
      .patch(`/api/users/${headId}/deactivate`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot deactivate your own account/i);
  });

  it('Returns 404 when user not found', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/users/${targetId}/deactivate`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(404);
  });

  it('Faculty cannot deactivate users (403)', async () => {
    const res = await request(app)
      .patch(`/api/users/${targetId}/deactivate`)
      .set('Cookie', [`token=${facultyToken}`]);

    expect(res.status).toBe(403);
  });
});
