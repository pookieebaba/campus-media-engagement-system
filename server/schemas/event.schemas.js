const { z } = require('zod');

const mongoIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

const checkInWindowSchema = z.object({
  start: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  end: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
}).optional();

const createEventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  venue: z
    .string()
    .min(2, 'Venue must be at least 2 characters')
    .max(200, 'Venue cannot exceed 200 characters'),
  participatingBlocks: z.array(mongoIdString).optional().default([]),
  assignedStudents: z.array(mongoIdString).optional().default([]),
  supervisors: z.array(mongoIdString).optional().default([]),
  rsvpDeadline: z.string().optional(),
  checkInWindow: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

const updateEventSchema = createEventSchema.partial();

const cancelEventSchema = z.object({
  cancelReason: z
    .string()
    .min(5, 'Cancel reason must be at least 5 characters')
    .max(500, 'Cancel reason cannot exceed 500 characters'),
});

module.exports = { createEventSchema, updateEventSchema, cancelEventSchema };
