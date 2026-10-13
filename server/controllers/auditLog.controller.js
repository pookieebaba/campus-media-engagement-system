const AuditLog = require('../models/AuditLog');

/**
 * GET /api/audit-logs
 * HEAD only. Paginated, filterable audit log listing.
 */
const listAuditLogs = async (req, res, next) => {
  try {
    const { actor, action, targetType, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (actor) filter.actor = actor;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (targetType) filter.targetType = targetType;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      logs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAuditLogs };
