require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS — only allow configured client origin with credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (required for httpOnly JWT cookies)
app.use(cookieParser());

// HTTP request logger (development only)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// NoSQL injection prevention
app.use(mongoSanitize());

// Rate limiting on all routes
app.use(generalLimiter);

// Health check — available without auth
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// ── Routes ──────────────────────────────────────────────────────────────────
// Routes will be mounted here as they are created in FEAT-002
// Example: app.use('/api/auth', require('./routes/auth'));
// Placeholder so server.js is importable from the start:
app.use('/api/auth', (req, res) => res.status(501).json({ message: 'Auth routes not yet implemented.' }));

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`CMES server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  });
}

module.exports = app;
