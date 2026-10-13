const { z } = require('zod');

const createBlockSchema = z.object({
  name: z
    .string()
    .min(2, 'Block name must be at least 2 characters')
    .max(100, 'Block name cannot exceed 100 characters'),
  code: z
    .string()
    .min(1, 'Block code is required')
    .max(20, 'Block code cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Block code may only contain letters, numbers, hyphens, and underscores'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

const updateBlockSchema = createBlockSchema.partial();

module.exports = { createBlockSchema, updateBlockSchema };
