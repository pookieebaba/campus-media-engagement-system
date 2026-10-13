const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * GET /api/notifications
 * Returns paginated notifications for the current user.
 */
const listNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { recipient: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name email role')
        .populate('relatedEvent', 'title date')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read (must belong to current user).
 */
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for current user as read.
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    return res
      .status(200)
      .json({ message: `${result.modifiedCount} notifications marked as read.` });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/announce
 * Faculty or HEAD. Creates notifications for specified recipients or block members.
 */
const announce = async (req, res, next) => {
  try {
    const { recipientIds, blockIds, title, message } = req.body;

    let finalRecipientIds = [];

    if (recipientIds && recipientIds.length > 0) {
      finalRecipientIds = [...recipientIds];
    }

    if (blockIds && blockIds.length > 0) {
      const blockStudents = await User.find({
        block: { $in: blockIds },
        role: 'student',
        isActive: true,
      }).select('_id');

      const blockStudentIds = blockStudents.map((u) => u._id.toString());
      finalRecipientIds = [...new Set([...finalRecipientIds, ...blockStudentIds])];
    }

    if (finalRecipientIds.length === 0) {
      return res.status(400).json({ message: 'No recipients found.' });
    }

    const notificationDocs = finalRecipientIds.map((recipientId) => ({
      recipient: recipientId,
      sender: req.user._id,
      type: 'announcement',
      title,
      message,
    }));

    await Notification.insertMany(notificationDocs, { ordered: false });

    return res.status(200).json({ sent: finalRecipientIds.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, markRead, markAllRead, announce };
