const { z } = require('zod');

const manualAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['present', 'absent', 'late', 'excused'], {
    errorMap: () => ({ message: 'Status must be present, absent, late, or excused' }),
  }),
  checkInMethod: z
    .enum(['manual', 'faculty_verified'], {
      errorMap: () => ({ message: 'Check-in method must be manual or faculty_verified' }),
    })
    .optional(),
});

const correctAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'excused'], {
    errorMap: () => ({ message: 'Status must be present, absent, late, or excused' }),
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const qrCheckinSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid event ID'),
  rawToken: z.string().min(1, 'QR token is required'),
});

module.exports = { manualAttendanceSchema, correctAttendanceSchema, qrCheckinSchema };
