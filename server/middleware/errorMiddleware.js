const AppError = require('../utils/AppError');

/**
 * Catch unmatched routes and forward a 404 AppError.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Centralized Express error-handling middleware.
 * Maps Mongoose and JWT errors into a unified JSON response shape.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((fieldErr) => ({
      field: fieldErr.path,
      message: fieldErr.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateFields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    message = `Duplicate value for ${duplicateFields}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  } else if (!err.isOperational && process.env.NODE_ENV === 'production') {
    statusCode = 500;
    message = 'Something went wrong';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFound,
  errorHandler,
};
