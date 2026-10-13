const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/audit');
const { generateQRToken, generateQRCodeDataURL } = require('../utils/qr');

/**
 * Build a visibility filter for the requesting user's role.
 */
function buildVisibilityFilter(user) {
  if (user.role === 'head') return {};
  if (user.role === 'faculty') return { supervisors: user._id };
  // student
  return {
    assignedStudents: user._id,
    status: { $in: ['published', 'ongoing', 'completed'] },
  };
}

/**
 * GET /api/events
 */
const listEvents = async (req, res, next) => {
  try {
    const { status, block, search, page = 1, limit = 20 } = req.query;

    const filter = buildVisibilityFilter(req.user);

    if (status) filter.status = status;
    if (block) filter.participatingBlocks = block;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name email')
        .populate('supervisors', 'name email')
        .populate('participatingBlocks', 'name code')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      events,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/events
 * HEAD or faculty.
 */
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      participatingBlocks,
      assignedStudents,
      supervisors,
      rsvpDeadline,
      checkInWindow,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      venue,
      status: 'draft',
      organizer: req.user._id,
      supervisors: supervisors || [],
      participatingBlocks: participatingBlocks || [],
      assignedStudents: assignedStudents || [],
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : undefined,
      checkInWindow: checkInWindow
        ? {
            start: checkInWindow.start ? new Date(checkInWindow.start) : undefined,
            end: checkInWindow.end ? new Date(checkInWindow.end) : undefined,
          }
        : undefined,
    });

    await logAudit({
      actor: req.user._id,
      action: 'event.create',
      targetType: 'Event',
      targetId: event._id,
      changes: { after: { title: event.title, status: event.status } },
      req,
    });

    return res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:id
 */
const getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visibilityFilter = buildVisibilityFilter(req.user);
    visibilityFilter._id = id;

    const event = await Event.findOne(visibilityFilter)
      .populate('organizer', 'name email role')
      .populate('supervisors', 'name email')
      .populate('participatingBlocks', 'name code')
      .populate('assignedStudents', 'name email studentId block');

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    return res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/events/:id
 * HEAD or assigned supervisor.
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Authorization: HEAD or assigned supervisor
    if (
      req.user.role !== 'head' &&
      !event.supervisors.map((s) => s.toString()).includes(req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (['completed', 'cancelled'].includes(event.status)) {
      return res
        .status(400)
        .json({ message: 'Cannot update a completed or cancelled event.' });
    }

    const before = {
      title: event.title,
      status: event.status,
      date: event.date,
      venue: event.venue,
    };

    const updatableFields = [
      'title', 'description', 'date', 'startTime', 'endTime',
      'venue', 'participatingBlocks', 'assignedStudents', 'supervisors',
      'rsvpDeadline', 'checkInWindow',
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        if (['date', 'rsvpDeadline'].includes(field)) {
          event[field] = new Date(req.body[field]);
        } else {
          event[field] = req.body[field];
        }
      }
    }

    await event.save();

    const after = {
      title: event.title,
      status: event.status,
      date: event.date,
      venue: event.venue,
    };

    await logAudit({
      actor: req.user._id,
      action: 'event.update',
      targetType: 'Event',
      targetId: event._id,
      changes: { before, after },
      req,
    });

    return res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/events/:id/publish
 * HEAD only. draft -> published. Creates EventParticipation records, sends notifications.
 */
const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be published.' });
    }

    event.status = 'published';
    await event.save();

    // Create EventParticipation records for all assignedStudents
    if (event.assignedStudents && event.assignedStudents.length > 0) {
      const participationDocs = event.assignedStudents.map((studentId) => ({
        event: event._id,
        student: studentId,
        rsvpStatus: 'pending',
      }));

      // Use insertMany with ordered:false to skip duplicates
      try {
        await EventParticipation.insertMany(participationDocs, { ordered: false });
      } catch (bulkErr) {
        // Ignore duplicate key errors (students already have records)
        if (bulkErr.code !== 11000 && !bulkErr.message?.includes('11000')) {
          console.warn('[publishEvent] insertMany error:', bulkErr.message);
        }
      }

      // Send notification to each student
      const notificationDocs = event.assignedStudents.map((studentId) => ({
        recipient: studentId,
        sender: req.user._id,
        type: 'event_published',
        title: `New Event: ${event.title}`,
        message: `You have been invited to participate in "${event.title}" on ${new Date(event.date).toDateString()}.`,
        relatedEvent: event._id,
      }));

      await Notification.insertMany(notificationDocs, { ordered: false });
    }

    await logAudit({
      actor: req.user._id,
      action: 'event.publish',
      targetType: 'Event',
      targetId: event._id,
      changes: { before: { status: 'draft' }, after: { status: 'published' } },
      req,
    });

    return res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/events/:id/cancel
 * HEAD only.
 */
const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed event.' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Event is already cancelled.' });
    }

    const prevStatus = event.status;
    event.status = 'cancelled';
    event.cancelReason = cancelReason;
    await event.save();

    // Notify all assigned students and supervisors
    const recipientIds = [
      ...event.assignedStudents.map((s) => s.toString()),
      ...event.supervisors.map((s) => s.toString()),
    ];

    const uniqueRecipients = [...new Set(recipientIds)];

    if (uniqueRecipients.length > 0) {
      const notificationDocs = uniqueRecipients.map((recipientId) => ({
        recipient: recipientId,
        sender: req.user._id,
        type: 'event_cancelled',
        title: `Event Cancelled: ${event.title}`,
        message: `The event "${event.title}" has been cancelled. Reason: ${cancelReason}`,
        relatedEvent: event._id,
      }));

      await Notification.insertMany(notificationDocs, { ordered: false });
    }

    await logAudit({
      actor: req.user._id,
      action: 'event.cancel',
      targetType: 'Event',
      targetId: event._id,
      changes: { before: { status: prevStatus }, after: { status: 'cancelled', cancelReason } },
      req,
    });

    return res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:id/qr
 * Faculty or HEAD only. Generates/refreshes QR code.
 */
const getQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    // HEAD can always access; faculty must be a supervisor
    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(id).select('+qrToken');
    } else {
      event = await Event.findOne({ _id: id, supervisors: req.user._id }).select('+qrToken');
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    if (['completed', 'cancelled'].includes(event.status)) {
      return res
        .status(400)
        .json({ message: 'Cannot generate QR code for completed or cancelled events.' });
    }

    // Calculate event end datetime from event.date + event.endTime
    let eventEndTime = event.date ? new Date(event.date) : new Date();
    if (event.endTime) {
      const [hours, minutes] = event.endTime.split(':').map(Number);
      eventEndTime.setHours(hours, minutes, 0, 0);
    }

    const { rawToken, hashedToken, expires } = generateQRToken(eventEndTime);

    event.qrToken = hashedToken;
    event.qrTokenExpires = expires;
    await event.save();

    const qrDataURL = await generateQRCodeDataURL(rawToken);

    return res.status(200).json({ qrDataURL, expires });
  } catch (err) {
    next(err);
  }
};

module.exports = { listEvents, createEvent, getEvent, updateEvent, publishEvent, cancelEvent, getQRCode };
