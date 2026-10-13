const Attendance = require('../models/Attendance');
const EventParticipation = require('../models/EventParticipation');

/**
 * Build base match stage for attendance/participation reports.
 */
function buildMatchStage({ eventId, blockId, status, dateFrom, dateTo } = {}) {
  const match = {};
  if (eventId) match.event = require('mongoose').Types.ObjectId.createFromHexString(eventId);
  if (status) match.status = status;
  return match;
}

/**
 * GET /api/reports/attendance
 * HEAD only.
 */
const attendanceReport = async (req, res, next) => {
  try {
    const { eventId, blockId, status, dateFrom, dateTo } = req.query;

    const matchBase = {};
    if (eventId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(eventId)) {
        matchBase.event = new Types.ObjectId(eventId);
      }
    }
    if (status) matchBase.status = status;

    const pipeline = [
      { $match: matchBase },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData',
        },
      },
      { $unwind: '$studentData' },
      {
        $lookup: {
          from: 'blocks',
          localField: 'studentData.block',
          foreignField: '_id',
          as: 'blockData',
        },
      },
      {
        $unwind: { path: '$blockData', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData',
        },
      },
      { $unwind: '$eventData' },
    ];

    // Filter by block if provided
    if (blockId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(blockId)) {
        pipeline.push({ $match: { 'studentData.block': new Types.ObjectId(blockId) } });
      }
    }

    // Filter by date range on event
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      pipeline.push({ $match: { 'eventData.date': dateFilter } });
    }

    pipeline.push({
      $project: {
        _id: 1,
        studentId: '$studentData.studentId',
        studentName: '$studentData.name',
        block: '$blockData.code',
        event: '$eventData.title',
        eventDate: '$eventData.date',
        status: 1,
        checkInTime: 1,
        checkInMethod: 1,
        isFinalized: 1,
      },
    });

    const records = await Attendance.aggregate(pipeline);

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
 * GET /api/reports/participation
 * HEAD only.
 */
const participationReport = async (req, res, next) => {
  try {
    const { eventId, blockId, rsvpStatus, dateFrom, dateTo } = req.query;

    const matchBase = {};
    if (eventId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(eventId)) {
        matchBase.event = new Types.ObjectId(eventId);
      }
    }
    if (rsvpStatus) matchBase.rsvpStatus = rsvpStatus;

    const pipeline = [
      { $match: matchBase },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData',
        },
      },
      { $unwind: '$studentData' },
      {
        $lookup: {
          from: 'blocks',
          localField: 'studentData.block',
          foreignField: '_id',
          as: 'blockData',
        },
      },
      {
        $unwind: { path: '$blockData', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData',
        },
      },
      { $unwind: '$eventData' },
    ];

    if (blockId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(blockId)) {
        pipeline.push({ $match: { 'studentData.block': new Types.ObjectId(blockId) } });
      }
    }

    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      pipeline.push({ $match: { 'eventData.date': dateFilter } });
    }

    pipeline.push({
      $project: {
        studentId: '$studentData.studentId',
        studentName: '$studentData.name',
        block: '$blockData.code',
        event: '$eventData.title',
        eventDate: '$eventData.date',
        rsvpStatus: 1,
        rsvpAt: 1,
      },
    });

    const records = await EventParticipation.aggregate(pipeline);

    const summary = {
      total: records.length,
      going: records.filter((r) => r.rsvpStatus === 'going').length,
      not_going: records.filter((r) => r.rsvpStatus === 'not_going').length,
      pending: records.filter((r) => r.rsvpStatus === 'pending').length,
    };

    return res.status(200).json({ records, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/export/attendance
 * HEAD only. Streams CSV.
 */
const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { eventId, blockId, status, dateFrom, dateTo } = req.query;

    const matchBase = {};
    if (eventId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(eventId)) matchBase.event = new Types.ObjectId(eventId);
    }
    if (status) matchBase.status = status;

    const records = await Attendance.find(matchBase)
      .populate('student', 'name studentId block')
      .populate({ path: 'student', populate: { path: 'block', select: 'code' } })
      .populate('event', 'title date');

    // CSV header
    const header = 'studentId,name,block,event,date,status,checkInTime,checkInMethod\n';
    const rows = records
      .map((r) => {
        const student = r.student || {};
        const event = r.event || {};
        const block = student.block || {};
        const date = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
        const checkInTime = r.checkInTime ? new Date(r.checkInTime).toISOString() : '';
        return [
          student.studentId || '',
          `"${(student.name || '').replace(/"/g, '""')}"`,
          block.code || '',
          `"${(event.title || '').replace(/"/g, '""')}"`,
          date,
          r.status || '',
          checkInTime,
          r.checkInMethod || '',
        ].join(',');
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    return res.send(header + rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/export/participation
 * HEAD only. Streams CSV.
 */
const exportParticipationCSV = async (req, res, next) => {
  try {
    const { eventId, blockId, rsvpStatus, dateFrom, dateTo } = req.query;

    const matchBase = {};
    if (eventId) {
      const { Types } = require('mongoose');
      if (Types.ObjectId.isValid(eventId)) matchBase.event = new Types.ObjectId(eventId);
    }
    if (rsvpStatus) matchBase.rsvpStatus = rsvpStatus;

    const records = await EventParticipation.find(matchBase)
      .populate('student', 'name studentId block')
      .populate({ path: 'student', populate: { path: 'block', select: 'code' } })
      .populate('event', 'title date');

    const header = 'studentId,name,block,event,rsvpStatus,rsvpAt\n';
    const rows = records
      .map((r) => {
        const student = r.student || {};
        const event = r.event || {};
        const block = student.block || {};
        const rsvpAt = r.rsvpAt ? new Date(r.rsvpAt).toISOString() : '';
        return [
          student.studentId || '',
          `"${(student.name || '').replace(/"/g, '""')}"`,
          block.code || '',
          `"${(event.title || '').replace(/"/g, '""')}"`,
          r.rsvpStatus || '',
          rsvpAt,
        ].join(',');
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=participation.csv');
    return res.send(header + rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { attendanceReport, participationReport, exportAttendanceCSV, exportParticipationCSV };
