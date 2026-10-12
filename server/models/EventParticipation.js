const mongoose = require('mongoose');

const eventParticipationSchema = new mongoose.Schema(
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
    rsvpStatus: {
      type: String,
      enum: ['pending', 'going', 'not_going'],
      default: 'pending',
    },
    rsvpAt: {
      type: Date,
    },
    changedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one RSVP per student per event
eventParticipationSchema.index({ event: 1, student: 1 }, { unique: true });
eventParticipationSchema.index({ student: 1 });
eventParticipationSchema.index({ event: 1, rsvpStatus: 1 });

module.exports = mongoose.model('EventParticipation', eventParticipationSchema);
