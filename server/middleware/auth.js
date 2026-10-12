const jwt = require('jsonwebtoken');

/**
 * verifyToken — reads JWT from httpOnly cookie, verifies it,
 * and attaches req.user = { _id, role } from the payload.
 * Never trusts role from req.body.
 */
const verifyToken = (req, res, next) => {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only attach _id and role from the verified token — never from request body
    req.user = {
      _id: decoded._id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

module.exports = { verifyToken };
