/**
 * authorize(...roles) — middleware factory that checks req.user.role
 * is among the allowed roles. Returns 403 if not.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }
    next();
  };
};

/**
 * authorizeOwnerOrHead(getOwnerId) — middleware factory for resource-owner checks.
 * getOwnerId is an async function that receives req and returns the owner's _id string.
 * Allows access if req.user.role === 'head' OR req.user._id === ownerId.
 */
const authorizeOwnerOrHead = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'head') return next();

      const ownerId = await getOwnerId(req);
      if (!ownerId) {
        return res.status(404).json({ message: 'Resource not found.' });
      }

      if (req.user._id.toString() === ownerId.toString()) {
        return next();
      }

      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.',
      });
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authorize, authorizeOwnerOrHead };
