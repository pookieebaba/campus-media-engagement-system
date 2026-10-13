const { z } = require('zod');

const announceSchema = z.object({
  recipientIds: z.array(z.string()).optional(),
  blockIds: z.array(z.string()).optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message cannot exceed 1000 characters'),
}).refine(
  (data) =>
    (data.recipientIds && data.recipientIds.length > 0) ||
    (data.blockIds && data.blockIds.length > 0),
  {
    message: 'Either recipientIds or blockIds must be provided',
    path: ['recipientIds'],
  }
);

module.exports = { announceSchema };
