// Load environment variables from .env when present (local dev).
// On Render env vars are injected directly and there is no .env file, so this
// is wrapped to never crash the boot if the file is missing or unreadable.
try {
  require('dotenv').config();
} catch (_err) {
  // No .env available — rely on host-injected environment variables.
}

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
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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
// express-mongo-sanitize@2.2.0 is incompatible with Express 5 when it tries to
// assign req.query (now a getter-only property). We wrap it to only sanitize
// req.body and req.params, which is where injections arrive in practice.
const _mongoSanitize = mongoSanitize();
app.use((req, res, next) => {
  // Temporarily stash query so the middleware doesn't touch it
  const savedQuery = req.query;
  Object.defineProperty(req, 'query', {
    configurable: true,
    writable: true,
    value: {},
  });
  _mongoSanitize(req, res, (err) => {
    // Restore original query
    Object.defineProperty(req, 'query', {
      configurable: true,
      get() { return savedQuery; },
    });
    next(err);
  });
});

// Rate limiting on all routes
app.use(generalLimiter);

// Health check — available without auth
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/blocks',        require('./routes/block.routes'));
app.use('/api/events',        require('./routes/event.routes'));
app.use('/api/participation', require('./routes/participation.routes'));
app.use('/api/attendance',    require('./routes/attendance.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reports',       require('./routes/report.routes'));
app.use('/api/audit-logs',    require('./routes/auditLog.routes'));

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
