const { Router } = require('express');
const {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getQRCode,
} = require('../controllers/event.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createEventSchema, updateEventSchema, cancelEventSchema } = require('../schemas/event.schemas');

const router = Router();

// All event routes require authentication
router.use(verifyToken);

// GET /api/events
router.get('/', listEvents);

// POST /api/events — HEAD or faculty (role gated in controller)
router.post('/', authorize('head', 'faculty'), validate(createEventSchema), createEvent);

// GET /api/events/:id
router.get('/:id', getEvent);

// PUT /api/events/:id — HEAD or assigned supervisor (enforced in controller)
router.put('/:id', authorize('head', 'faculty'), validate(updateEventSchema), updateEvent);

// PATCH /api/events/:id/publish — HEAD only
router.patch('/:id/publish', authorize('head'), publishEvent);

// PATCH /api/events/:id/cancel — HEAD only
router.patch('/:id/cancel', authorize('head'), validate(cancelEventSchema), cancelEvent);

// GET /api/events/:id/qr — faculty or HEAD
router.get('/:id/qr', authorize('head', 'faculty'), getQRCode);

module.exports = router;
