const { Router } = require('express');
const { listNotifications, markRead, markAllRead, announce } = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { announceSchema } = require('../schemas/notification.schemas');

const router = Router();

// All notification routes require authentication
router.use(verifyToken);

// GET /api/notifications
router.get('/', listNotifications);

// PATCH /api/notifications/read-all
router.patch('/read-all', markAllRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markRead);

// POST /api/notifications/announce — faculty or HEAD
router.post('/announce', authorize('head', 'faculty'), validate(announceSchema), announce);

module.exports = router;
