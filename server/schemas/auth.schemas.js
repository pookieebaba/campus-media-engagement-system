const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email address'),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
      'Password must contain at least one uppercase letter, one number, and one special character'
    ),
});

module.exports = { loginSchema, forgotPasswordSchema, resetPasswordSchema };
