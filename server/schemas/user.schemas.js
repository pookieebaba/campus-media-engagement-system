const { z } = require('zod');

const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['head', 'faculty', 'student'], {
    errorMap: () => ({ message: 'Role must be head, faculty, or student' }),
  }),
  studentId: z
    .string()
    .min(3, 'Student ID must be at least 3 characters')
    .max(50, 'Student ID cannot exceed 50 characters')
    .optional(),
  blockId: z.string().optional(),
  supervisorId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  email: z.string().email('Must be a valid email address').optional(),
  blockId: z.string().optional(),
  supervisorId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const bulkImportRowSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Must be a valid email address'),
  studentId: z
    .string()
    .min(3, 'Student ID must be at least 3 characters')
    .max(50, 'Student ID cannot exceed 50 characters'),
  blockCode: z.string().min(1, 'Block code is required'),
  supervisorEmail: z.string().email('Must be a valid email address').optional(),
});

module.exports = { createUserSchema, updateUserSchema, bulkImportRowSchema };
