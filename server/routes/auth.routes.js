const { Router } = require('express');
const { login, logout, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schemas');

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

module.exports = router;
