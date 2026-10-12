const rateLimit = require('express-rate-limit');

/**
 * generalLimiter — 100 requests per 15 minutes for all routes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * authLimiter — 5 requests per 15 minutes for auth routes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
  skipSuccessfulRequests: true,
});

module.exports = { generalLimiter, authLimiter };
