const mongoose = require('mongoose');

const correctionEntrySchema = new mongoose.Schema(
  {
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    correctedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
    },
    checkInMethod: {
      type: String,
      enum: ['qr', 'manual', 'faculty_verified'],
    },
    checkInTime: {
      type: Date,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    correctionHistory: [correctionEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one attendance record per student per event
attendanceSchema.index({ event: 1, student: 1 }, { unique: true });
attendanceSchema.index({ event: 1, status: 1 });
attendanceSchema.index({ student: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
