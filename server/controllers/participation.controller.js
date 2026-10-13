const EventParticipation = require('../models/EventParticipation');
const Event = require('../models/Event');

/**
 * GET /api/participation/:eventId
 * Faculty supervisor of event or HEAD.
 */
const listParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify event exists and user has access
    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ _id: eventId, supervisors: req.user._id });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    const participants = await EventParticipation.find({ event: eventId })
      .populate('student', 'name email studentId block')
      .sort({ rsvpAt: -1 });

    // Group by rsvpStatus
    const grouped = {
      going: [],
      not_going: [],
      pending: [],
    };

    for (const p of participants) {
      grouped[p.rsvpStatus]?.push(p);
    }

    return res.status(200).json({
      participants,
      grouped,
      summary: {
        total: participants.length,
        going: grouped.going.length,
        not_going: grouped.not_going.length,
        pending: grouped.pending.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/participation/:eventId/rsvp
 * Student only. Updates own RSVP.
 */
const rsvp = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { rsvpStatus } = req.body;

    // Student can only RSVP for events they are assigned to
    const event = await Event.findOne({
      _id: eventId,
      assignedStudents: req.user._id,
      status: { $in: ['published', 'ongoing'] },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or you are not assigned to it.' });
    }

    // Check RSVP deadline
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      return res.status(400).json({ message: 'RSVP deadline has passed.' });
    }

    // Find and update participation record (must exist — created when event was published)
    const participation = await EventParticipation.findOne({
      event: eventId,
      student: req.user._id,
    });

    if (!participation) {
      return res
        .status(404)
        .json({ message: 'Participation record not found. Contact an administrator.' });
    }

    const now = new Date();
    participation.changedAt = now;

    if (!participation.rsvpAt) {
      participation.rsvpAt = now;
    }

    participation.rsvpStatus = rsvpStatus;
    await participation.save();

    return res.status(200).json({ participation });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/participation/my
 * Student only. Returns all their participation records.
 */
const myParticipation = async (req, res, next) => {
  try {
    const participations = await EventParticipation.find({ student: req.user._id })
      .populate('event', 'title date startTime endTime venue status')
      .sort({ createdAt: -1 });

    return res.status(200).json({ participations });
  } catch (err) {
    next(err);
  }
};

module.exports = { listParticipants, rsvp, myParticipation };
