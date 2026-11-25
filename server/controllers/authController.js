const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
} = require('../utils/generateTokens');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
});

const clearRefreshCookie = (res) => {
  const { maxAge, ...clearOptions } = getRefreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Issue a fresh access + refresh token pair, persist the hashed refresh token,
 * and set the httpOnly refresh cookie.
 */
const issueTokensAndSetCookie = async (user, res) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  return accessToken;
};

/**
 * POST /api/auth/register
 * Register a new tenant or owner account. Self-registration as admin is forbidden.
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  if (role === 'admin' || (role !== undefined && !['tenant', 'owner'].includes(role))) {
    return next(new AppError('Registration is only allowed for tenant or owner roles', 403));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'tenant',
  });

  const accessToken = await issueTokensAndSetCookie(user, res);

  res.status(201).json({
    success: true,
    accessToken,
    user: sanitizeUser(user),
  });
});

/**
 * POST /api/auth/login
 * Authenticate user credentials and issue rotating tokens.
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  const accessToken = await issueTokensAndSetCookie(user, res);

  res.status(200).json({
    success: true,
    accessToken,
    user: sanitizeUser(user),
  });
});

/**
 * POST /api/auth/refresh
 * Validate rotating refresh token cookie, detect reuse, and issue new tokens.
 */
const refresh = asyncHandler(async (req, res, next) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!incomingToken) {
    return next(new AppError('Refresh token missing', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    clearRefreshCookie(res);
    return next(err);
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    clearRefreshCookie(res);
    return next(new AppError('Invalid refresh session', 401));
  }

  const incomingHash = hashToken(incomingToken);
  if (incomingHash !== user.refreshTokenHash) {
    // Reuse detected: revoke stored session immediately
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });
    clearRefreshCookie(res);
    return next(new AppError('Refresh token reuse detected. Please log in again.', 401));
  }

  const accessToken = await issueTokensAndSetCookie(user, res);

  res.status(200).json({
    success: true,
    accessToken,
  });
});

/**
 * POST /api/auth/logout
 * Revoke stored refresh token hash and clear refresh cookie.
 */
const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (incomingToken) {
    const incomingHash = hashToken(incomingToken);
    await User.updateOne(
      { refreshTokenHash: incomingHash },
      { $set: { refreshTokenHash: null } }
    );
  }

  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
