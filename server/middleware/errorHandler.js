/**
 * Global Express error handler.
 * Must be the last middleware added to the Express app.
 */
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log the full error in development only
  if (isDev) {
    console.error('[ErrorHandler]', err);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      message: `A record with this ${field} already exists.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  // Zod errors (if thrown directly)
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({ message: 'Validation failed.', errors });
  }

  // Default 500
  const statusCode = err.statusCode || err.status || 500;
  const message =
    isDev ? err.message : statusCode < 500 ? err.message : 'An unexpected error occurred.';

  return res.status(statusCode).json({
    message,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
