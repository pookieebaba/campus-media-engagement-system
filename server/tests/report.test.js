'use strict';

/**
 * report.test.js
 * Regression tests for the HEAD attendance & participation report endpoints.
 * Locks in the response contract the client consumes:
 *   { data: [ { _id, status, student: { _id, name, studentId, block }, event: { _id, title, date } } ], summary }
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
jest.mock('../models/Notification', () => ({
  insertMany: jest.fn().mockResolvedValue([]),
}));

// Mock models BEFORE requiring the app
jest.mock('../models/Event');
jest.mock('../models/EventParticipation');
jest.mock('../models/Attendance');

const Attendance = require('../models/Attendance');
const EventParticipation = require('../models/EventParticipation');
const app = require('../server');

// ── Token helpers ─────────────────────────────────────────────────────────────
const headId = '64f000000000000000000001';
const studentId = '64f000000000000000000003';
const eventId = '64e000000000000000000001';

function makeToken(id, role) {
  return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
const headToken = makeToken(headId, 'head');
const facultyToken = makeToken('64f000000000000000000002', 'faculty');

// ── Fixtures (nested shape the controller now projects) ──────────────────────
const attendanceRecords = [
  {
    _id: '64a000000000000000000001',
    status: 'present',
    checkInMethod: 'qr',
    checkInTime: new Date('2025-10-26T09:05:00Z'),
    isFinalized: true,
    student: {
      _id: studentId,
      name: 'Aarav Sharma',
      studentId: 'STU001',
      block: { _id: '64b000000000000000000001', name: 'Block A', code: 'A' },
    },
    event: {
      _id: eventId,
      title: 'Media Day',
      date: new Date('2025-10-26'),
    },
  },
  {
    _id: '64a000000000000000000002',
    status: 'absent',
    checkInMethod: null,
    checkInTime: null,
    isFinalized: false,
    student: {
      _id: '64f000000000000000000004',
      name: 'Diya Patel',
      studentId: 'STU002',
      block: { _id: '64b000000000000000000002', name: 'Block B', code: 'B' },
    },
    event: {
      _id: eventId,
      title: 'Media Day',
      date: new Date('2025-10-26'),
    },
  },
];

const participationRecords = [
  {
    _id: '64p000000000000000000001',
    rsvpStatus: 'going',
    rsvpAt: new Date('2025-10-20T10:00:00Z'),
    student: {
      _id: studentId,
      name: 'Aarav Sharma',
      studentId: 'STU001',
      block: { _id: '64b000000000000000000001', name: 'Block A', code: 'A' },
    },
    event: { _id: eventId, title: 'Media Day', date: new Date('2025-10-26') },
  },
  {
    _id: '64p000000000000000000002',
    rsvpStatus: 'not_going',
    rsvpAt: new Date('2025-10-20T11:00:00Z'),
    student: {
      _id: '64f000000000000000000004',
      name: 'Diya Patel',
      studentId: 'STU002',
      block: { _id: '64b000000000000000000002', name: 'Block B', code: 'B' },
    },
    event: { _id: eventId, title: 'Media Day', date: new Date('2025-10-26') },
  },
];

// ── GET /api/reports/attendance ───────────────────────────────────────────────
describe('GET /api/reports/attendance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns { data, summary } with nested student/event (200)', async () => {
    Attendance.aggregate = jest.fn().mockResolvedValue(attendanceRecords);

    const res = await request(app)
      .get('/api/reports/attendance')
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    // Envelope: array lives under `data`, not `records`
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    // No legacy flat `records` key
    expect(res.body.records).toBeUndefined();
    // Nested shape the client columns dereference
    expect(res.body.data[0].student.studentId).toBe('STU001');
    expect(res.body.data[0].student.name).toBe('Aarav Sharma');
    expect(res.body.data[0].student.block.code).toBe('A');
    expect(res.body.data[0].event.title).toBe('Media Day');
    expect(res.body.data[0].event._id).toBe(eventId);
    // Summary counts
    expect(res.body.summary).toEqual({
      total: 2,
      present: 1,
      absent: 1,
      late: 0,
      excused: 0,
    });
  });

  it('scopes by ?student (StudentDetailPage filter)', async () => {
    Attendance.aggregate = jest.fn().mockResolvedValue([attendanceRecords[0]]);

    const res = await request(app)
      .get(`/api/reports/attendance?student=${studentId}`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // The first pipeline stage must $match on the student ObjectId
    const pipeline = Attendance.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toHaveProperty('$match');
    expect(pipeline[0].$match.student).toBeDefined();
    expect(pipeline[0].$match.student.toHexString()).toBe(studentId);
  });

  it('rejects non-HEAD roles (403)', async () => {
    const res = await request(app)
      .get('/api/reports/attendance')
      .set('Cookie', [`token=${facultyToken}`]);

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const res = await request(app).get('/api/reports/attendance');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/reports/participation ───────────────────────────────────────────
describe('GET /api/reports/participation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns { data, summary } with nested student/event (200)', async () => {
    EventParticipation.aggregate = jest.fn().mockResolvedValue(participationRecords);

    const res = await request(app)
      .get('/api/reports/participation')
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.records).toBeUndefined();
    expect(res.body.data[0].student.studentId).toBe('STU001');
    expect(res.body.data[0].event.title).toBe('Media Day');
    expect(res.body.data[0].rsvpStatus).toBe('going');
    expect(res.body.summary).toEqual({
      total: 2,
      going: 1,
      not_going: 1,
      pending: 0,
    });
  });
});
