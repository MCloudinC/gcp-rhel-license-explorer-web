const logger = require('./logger');

/**
 * Global error handling middleware for Express
 * Must be defined with 4 parameters to be recognized as error handler
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
  } else if (err.code === 'PERMISSION_DENIED') {
    statusCode = 403;
    message = 'Insufficient GCP permissions';
  } else if (err.code === 'NOT_FOUND') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 'UNAUTHENTICATED') {
    statusCode = 401;
    message = 'Authentication required';
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.status && err.status < 500) {
    statusCode = err.status;
    message = err.message;
  }

  // Prepare error response
  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;