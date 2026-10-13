'use strict';

/**
 * event.test.js
 * Tests for event creation, publishing, RSVP, and QR check-in.
 * All mongoose models are mocked — no live DB required.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const Attendance = require('../models/Attendance');

const app = require('../server');

// ── Token helpers ─────────────────────────────────────────────────────────────
const headId    = '64f000000000000000000001';
const facultyId = '64f000000000000000000002';
const studentId = '64f000000000000000000003';
const eventId   = '64e000000000000000000001';

function makeToken(id, role) {
  return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const headToken    = makeToken(headId,    'head');
const facultyToken = makeToken(facultyId, 'faculty');
const studentToken = makeToken(studentId, 'student');

// ── Shared event fixture ──────────────────────────────────────────────────────
function makeEventDoc(overrides = {}) {
  return Object.assign({
    _id: eventId,
    title: 'Campus Media Day',
    description: 'Annual showcase',
    date: new Date('2025-09-15'),
    startTime: '09:00',
    endTime: '17:00',
    venue: 'Main Hall',
    status: 'draft',
    organizer: headId,
    supervisors: [],
    participatingBlocks: [],
    assignedStudents: [],
    rsvpDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    qrToken: null,
    qrTokenExpires: null,
    checkInWindow: null,
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnThis(),
  }, overrides);
}

// ── POST /api/events — createEvent ────────────────────────────────────────────
describe('POST /api/events', () => {
  const validBody = {
    title: 'Campus Media Day',
    date: '2025-09-15',
    startTime: '09:00',
    endTime: '17:00',
    venue: 'Main Hall',
  };

  beforeEach(() => jest.clearAllMocks());

  it('HEAD can create an event (201)', async () => {
    Event.create = jest.fn().mockResolvedValue(makeEventDoc());

    const res = await request(app)
      .post('/api/events')
      .set('Cookie', [`token=${headToken}`])
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.title).toBe('Campus Media Day');
  });

  it('Faculty can create an event (201)', async () => {
    Event.create = jest.fn().mockResolvedValue(makeEventDoc({ organizer: facultyId }));

    const res = await request(app)
      .post('/api/events')
      .set('Cookie', [`token=${facultyToken}`])
      .send(validBody);

    expect(res.status).toBe(201);
  });

  it('Student cannot create an event (403)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', [`token=${studentToken}`])
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('Returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/events')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('Returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', [`token=${headToken}`])
      .send({ title: 'Missing fields' }); // missing date, startTime etc.

    expect(res.status).toBe(422);
  });
});

// ── PATCH /api/events/:id/publish ─────────────────────────────────────────────
describe('PATCH /api/events/:id/publish', () => {
  beforeEach(() => jest.clearAllMocks());

  it('HEAD can publish a draft event (200)', async () => {
    const eventDoc = makeEventDoc({
      status: 'draft',
      assignedStudents: [studentId],
    });
    Event.findById = jest.fn().mockResolvedValue(eventDoc);
    EventParticipation.insertMany = jest.fn().mockResolvedValue([]);

    const res = await request(app)
      .patch(`/api/events/${eventId}/publish`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(200);
    expect(eventDoc.status).toBe('published');
    expect(eventDoc.save).toHaveBeenCalled();
  });

  it('Faculty cannot publish an event (403)', async () => {
    const res = await request(app)
      .patch(`/api/events/${eventId}/publish`)
      .set('Cookie', [`token=${facultyToken}`]);

    expect(res.status).toBe(403);
  });

  it('Returns 400 when event is not in draft status', async () => {
    Event.findById = jest.fn().mockResolvedValue(makeEventDoc({ status: 'published' }));

    const res = await request(app)
      .patch(`/api/events/${eventId}/publish`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only draft/i);
  });

  it('Returns 404 when event not found', async () => {
    Event.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/events/${eventId}/publish`)
      .set('Cookie', [`token=${headToken}`]);

    expect(res.status).toBe(404);
  });
});

// ── RSVP ─────────────────────────────────────────────────────────────────────
describe('POST /api/participation/:eventId/rsvp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Student can RSVP going (200)', async () => {
    const eventDoc = makeEventDoc({
      status: 'published',
      assignedStudents: [studentId],
      rsvpDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const participationDoc = {
      _id: '64p000000000000000000001',
      event: eventId,
      student: studentId,
      rsvpStatus: 'pending',
      rsvpAt: null,
      changedAt: null,
      save: jest.fn().mockResolvedValue(true),
    };

    Event.findOne = jest.fn().mockResolvedValue(eventDoc);
    EventParticipation.findOne = jest.fn().mockResolvedValue(participationDoc);

    const res = await request(app)
      .post(`/api/participation/${eventId}/rsvp`)
      .set('Cookie', [`token=${studentToken}`])
      .send({ rsvpStatus: 'going' });

    expect(res.status).toBe(200);
    expect(participationDoc.rsvpStatus).toBe('going');
    expect(participationDoc.save).toHaveBeenCalled();
  });

  it('Student cannot RSVP after the deadline (400)', async () => {
    const eventDoc = makeEventDoc({
      status: 'published',
      assignedStudents: [studentId],
      rsvpDeadline: new Date(Date.now() - 1000), // past
    });

    Event.findOne = jest.fn().mockResolvedValue(eventDoc);

    const res = await request(app)
      .post(`/api/participation/${eventId}/rsvp`)
      .set('Cookie', [`token=${studentToken}`])
      .send({ rsvpStatus: 'going' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/deadline/i);
  });

  it('Faculty cannot RSVP (403)', async () => {
    const res = await request(app)
      .post(`/api/participation/${eventId}/rsvp`)
      .set('Cookie', [`token=${facultyToken}`])
      .send({ rsvpStatus: 'going' });

    expect(res.status).toBe(403);
  });

  it('Returns 404 when student is not assigned to event', async () => {
    Event.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/participation/${eventId}/rsvp`)
      .set('Cookie', [`token=${studentToken}`])
      .send({ rsvpStatus: 'going' });

    expect(res.status).toBe(404);
  });

  it('Returns 422 for invalid rsvpStatus', async () => {
    const res = await request(app)
      .post(`/api/participation/${eventId}/rsvp`)
      .set('Cookie', [`token=${studentToken}`])
      .send({ rsvpStatus: 'maybe' }); // invalid enum

    expect(res.status).toBe(422);
  });
});

// ── QR Check-in ───────────────────────────────────────────────────────────────
describe('POST /api/attendance/qr-checkin', () => {
  function makeValidToken() {
    const raw = 'a'.repeat(64); // predictable raw token
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    return { rawToken: raw, hashedToken: hashed };
  }

  beforeEach(() => jest.clearAllMocks());

  it('Valid QR token succeeds (200)', async () => {
    const { rawToken, hashedToken } = makeValidToken();
    const eventDoc = makeEventDoc({
      status: 'published',
      assignedStudents: [studentId],
      qrToken: hashedToken,
      qrTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
      checkInWindow: null,
    });

    Event.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(eventDoc),
    });

    Attendance.findOne = jest.fn().mockResolvedValue(null);
    Attendance.create = jest.fn().mockResolvedValue({
      _id: '64a000000000000000000001',
      event: eventId,
      student: studentId,
      status: 'present',
      checkInMethod: 'qr',
    });

    const res = await request(app)
      .post('/api/attendance/qr-checkin')
      .set('Cookie', [`token=${studentToken}`])
      .send({ eventId, rawToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/check-in successful/i);
  });

  it('Expired QR token returns 400', async () => {
    const { rawToken, hashedToken } = makeValidToken();
    const eventDoc = makeEventDoc({
      assignedStudents: [studentId],
      qrToken: hashedToken,
      qrTokenExpires: new Date(Date.now() - 1000), // expired
    });

    Event.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(eventDoc),
    });

    const res = await request(app)
      .post('/api/attendance/qr-checkin')
      .set('Cookie', [`token=${studentToken}`])
      .send({ eventId, rawToken });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('Wrong QR token returns 400', async () => {
    const { hashedToken } = makeValidToken();
    const eventDoc = makeEventDoc({
      assignedStudents: [studentId],
      qrToken: hashedToken,
      qrTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
    });

    Event.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(eventDoc),
    });

    const res = await request(app)
      .post('/api/attendance/qr-checkin')
      .set('Cookie', [`token=${studentToken}`])
      .send({ eventId, rawToken: 'b'.repeat(64) }); // different raw token

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid qr token/i);
  });

  it('Duplicate check-in returns 409', async () => {
    const { rawToken, hashedToken } = makeValidToken();
    const eventDoc = makeEventDoc({
      assignedStudents: [studentId],
      qrToken: hashedToken,
      qrTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
    });

    Event.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(eventDoc),
    });

    // Already has a present record — duplicate check-in
    Attendance.findOne = jest.fn().mockResolvedValue({
      status: 'present',
      isFinalized: false,
    });

    const res = await request(app)
      .post('/api/attendance/qr-checkin')
      .set('Cookie', [`token=${studentToken}`])
      .send({ eventId, rawToken });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already checked in/i);
  });

  it('Faculty cannot use QR check-in endpoint (403)', async () => {
    const { rawToken } = makeValidToken();

    const res = await request(app)
      .post('/api/attendance/qr-checkin')
      .set('Cookie', [`token=${facultyToken}`])
      .send({ eventId, rawToken });

    expect(res.status).toBe(403);
  });
});
