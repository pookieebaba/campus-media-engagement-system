const { Router } = require('express');
const {
  attendanceReport,
  participationReport,
  exportAttendanceCSV,
  exportParticipationCSV,
} = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

// All report routes require authentication and HEAD role
router.use(verifyToken, authorize('head'));

// GET /api/reports/attendance
router.get('/attendance', attendanceReport);

// GET /api/reports/participation
router.get('/participation', participationReport);

// GET /api/reports/export/attendance
router.get('/export/attendance', exportAttendanceCSV);

// GET /api/reports/export/participation
router.get('/export/participation', exportParticipationCSV);

module.exports = router;
