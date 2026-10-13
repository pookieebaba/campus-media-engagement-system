const { Router } = require('express');
const { listParticipants, rsvp, myParticipation } = require('../controllers/participation.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { rsvpSchema } = require('../schemas/participation.schemas');

const router = Router();

// All participation routes require authentication
router.use(verifyToken);

// GET /api/participation/my — student only
router.get('/my', authorize('student'), myParticipation);

// GET /api/participation/:eventId — faculty or HEAD
router.get('/:eventId', authorize('head', 'faculty'), listParticipants);

// POST /api/participation/:eventId/rsvp — student only
router.post('/:eventId/rsvp', authorize('student'), validate(rsvpSchema), rsvp);

module.exports = router;
