const AuditLog = require('../models/AuditLog');

/**
 * logAudit — creates an AuditLog document.
 * Swallows all errors so audit failure never breaks request flow.
 *
 * @param {Object} options
 * @param {string|ObjectId} options.actor - User performing the action
 * @param {string} options.action - Short action name (e.g. 'user.create')
 * @param {string} [options.targetType] - Model name of the target document
 * @param {*} [options.targetId] - _id of the target document
 * @param {Object} [options.changes] - { before, after }
 * @param {string} [options.ipAddress] - Caller IP
 * @param {import('express').Request} [options.req] - Express request (for auto IP extraction)
 */
async function logAudit({ actor, action, targetType, targetId, changes, ipAddress, req } = {}) {
  try {
    const ip =
      ipAddress ||
      (req &&
        (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          req.ip)) ||
      undefined;

    await AuditLog.create({
      actor,
      action,
      targetType,
      targetId,
      changes,
      ipAddress: ip,
    });
  } catch (err) {
    // Swallow — audit failure must never break the main request
    if (process.env.NODE_ENV === 'development') {
      console.warn('[audit] Failed to write audit log:', err.message);
    }
  }
}

module.exports = { logAudit };
