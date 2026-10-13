const { Router } = require('express');
const {
  listAttendance,
  qrCheckin,
  manualCheckin,
  correctAttendance,
  finalizeAttendance,
} = require('../controllers/attendance.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { qrCheckinSchema, manualAttendanceSchema, correctAttendanceSchema } = require('../schemas/attendance.schemas');

const router = Router();

// All attendance routes require authentication
router.use(verifyToken);

// POST /api/attendance/qr-checkin — student only
router.post('/qr-checkin', authorize('student'), validate(qrCheckinSchema), qrCheckin);

// GET /api/attendance/:eventId — faculty or HEAD
router.get('/:eventId', authorize('head', 'faculty'), listAttendance);

// POST /api/attendance/:eventId/manual — faculty or HEAD
router.post('/:eventId/manual', authorize('head', 'faculty'), validate(manualAttendanceSchema), manualCheckin);

// PATCH /api/attendance/:eventId/finalize — faculty or HEAD
router.patch('/:eventId/finalize', authorize('head', 'faculty'), finalizeAttendance);

// PATCH /api/attendance/:eventId/:attendanceId/correct — faculty or HEAD
router.patch(
  '/:eventId/:attendanceId/correct',
  authorize('head', 'faculty'),
  validate(correctAttendanceSchema),
  correctAttendance
);

module.exports = router;
