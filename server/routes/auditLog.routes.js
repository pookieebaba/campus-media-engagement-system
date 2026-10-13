const { Router } = require('express');
const { listAuditLogs } = require('../controllers/auditLog.controller');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

// All audit log routes require HEAD role
router.use(verifyToken, authorize('head'));

// GET /api/audit-logs
router.get('/', listAuditLogs);

module.exports = router;
