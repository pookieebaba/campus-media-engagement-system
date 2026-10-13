const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const User = require('../models/User');
const { logAudit } = require('../utils/audit');
const { verifyQRToken } = require('../utils/qr');

/**
 * GET /api/attendance/:eventId
 * Faculty supervisor or HEAD.
 */
const listAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ _id: eventId, supervisors: req.user._id });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    const records = await Attendance.find({ event: eventId })
      .populate('student', 'name email studentId block')
      .populate('faculty', 'name email')
      .sort({ checkInTime: 1 });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      excused: records.filter((r) => r.status === 'excused').length,
    };

    return res.status(200).json({ records, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/attendance/qr-checkin
 * Student only. Validates QR token and marks attendance.
 */
const qrCheckin = async (req, res, next) => {
  try {
    const { eventId, rawToken } = req.body;

    const event = await Event.findById(eventId).select('+qrToken');
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Verify student is assigned to this event
    const isAssigned = event.assignedStudents
      .map((s) => s.toString())
      .includes(req.user._id.toString());

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this event.' });
    }

    // Verify QR token
    if (!event.qrToken || !event.qrTokenExpires) {
      return res.status(400).json({ message: 'No active QR code for this event.' });
    }

    if (new Date() > event.qrTokenExpires) {
      return res.status(400).json({ message: 'QR code has expired.' });
    }

    const isValid = verifyQRToken(rawToken, event.qrToken);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid QR token.' });
    }

    // Check check-in window if set
    if (event.checkInWindow && event.checkInWindow.start && event.checkInWindow.end) {
      const now = new Date();
      if (now < event.checkInWindow.start || now > event.checkInWindow.end) {
        return res.status(400).json({ message: 'Check-in window is not currently open.' });
      }
    }

    // Prevent duplicate check-in (present or late)
    const existing = await Attendance.findOne({
      event: eventId,
      student: req.user._id,
    });

    if (existing && ['present', 'late'].includes(existing.status) && !existing.isFinalized) {
      return res.status(409).json({ message: 'You have already checked in to this event.' });
    }

    const now = new Date();

    if (existing) {
      // Update existing record
      if (existing.isFinalized) {
        return res
          .status(400)
          .json({ message: 'Attendance has been finalized and cannot be changed.' });
      }
      existing.status = 'present';
      existing.checkInMethod = 'qr';
      existing.checkInTime = now;
      await existing.save();
      return res.status(200).json({ attendance: existing, message: 'Check-in successful.' });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      event: eventId,
      student: req.user._id,
      status: 'present',
      checkInMethod: 'qr',
      checkInTime: now,
    });

    return res.status(200).json({ attendance, message: 'Check-in successful.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/attendance/:eventId/manual
 * Faculty or HEAD. Creates/updates attendance for a student.
 */
const manualCheckin = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { studentId, status, checkInMethod } = req.body;

    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ _id: eventId, supervisors: req.user._id });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    // Resolve studentId to user
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Verify student is in this event
    const isAssigned = event.assignedStudents
      .map((s) => s.toString())
      .includes(student._id.toString());

    if (!isAssigned) {
      return res.status(400).json({ message: 'Student is not assigned to this event.' });
    }

    const method = checkInMethod || 'faculty_verified';

    const attendance = await Attendance.findOneAndUpdate(
      { event: eventId, student: student._id },
      {
        event: eventId,
        student: student._id,
        faculty: req.user._id,
        status,
        checkInMethod: method,
        checkInTime: ['present', 'late'].includes(status) ? new Date() : undefined,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ attendance, message: 'Attendance recorded.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/attendance/:eventId/:attendanceId/correct
 * Faculty or HEAD. Appends to correctionHistory.
 */
const correctAttendance = async (req, res, next) => {
  try {
    const { eventId, attendanceId } = req.params;
    const { status, reason } = req.body;

    // Verify event access
    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ _id: eventId, supervisors: req.user._id });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    const attendance = await Attendance.findOne({ _id: attendanceId, event: eventId });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Finalized check — only HEAD can correct finalized records
    if (attendance.isFinalized && req.user.role !== 'head') {
      return res
        .status(403)
        .json({ message: 'Attendance has been finalized. Only the Head Administrator can correct it.' });
    }

    const previousStatus = attendance.status;

    attendance.correctionHistory.push({
      correctedBy: req.user._id,
      previousStatus,
      newStatus: status,
      reason,
      correctedAt: new Date(),
    });

    attendance.status = status;
    await attendance.save();

    await logAudit({
      actor: req.user._id,
      action: 'attendance.correct',
      targetType: 'Attendance',
      targetId: attendance._id,
      changes: { before: { status: previousStatus }, after: { status, reason } },
      req,
    });

    return res.status(200).json({ attendance, message: 'Attendance corrected.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/attendance/:eventId/finalize
 * Faculty supervisor or HEAD. Finalizes all attendance for event.
 */
const finalizeAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    let event;
    if (req.user.role === 'head') {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ _id: eventId, supervisors: req.user._id });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied.' });
    }

    const result = await Attendance.updateMany(
      { event: eventId, isFinalized: false },
      { isFinalized: true }
    );

    await logAudit({
      actor: req.user._id,
      action: 'attendance.finalize',
      targetType: 'Event',
      targetId: event._id,
      changes: { after: { recordsFinalized: result.modifiedCount } },
      req,
    });

    return res.status(200).json({
      message: `Attendance finalized. ${result.modifiedCount} records updated.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAttendance, qrCheckin, manualCheckin, correctAttendance, finalizeAttendance };
