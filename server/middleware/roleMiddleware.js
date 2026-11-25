const AppError = require('../utils/AppError');

/**
 * Restrict route access to users with one of the allowed roles.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  next();
};

module.exports = {
  authorize,
};
