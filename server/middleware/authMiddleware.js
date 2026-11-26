const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });

  const user = await User.findById(decoded.sub);
  if (!user) {
    return next(new AppError('User belonging to this token no longer exists', 401));
  }

  req.user = user;
  next();
});

/**
 * Optionally verify JWT access token if present; never rejects unauthenticated requests.
 */
const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    const user = await User.findById(decoded.sub);
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid or expired tokens on optional public routes
  }

  next();
};

module.exports = {
  protect,
  optionalProtect,
};
