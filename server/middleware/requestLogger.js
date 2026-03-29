/**
 * @fileoverview HTTP request logging middleware using morgan.
 * @module middleware/requestLogger
 */

const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

/**
 * @description Middleware that attaches a unique requestId to each request
 * and sets up morgan logging in the appropriate format.
 * @returns {Array<Function>} Array of middleware functions [requestId injector, morgan logger]
 */
function setupRequestLogger() {
  // Middleware to attach a unique requestId to every request
  const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  };

  // Morgan format based on environment
  const format = env.NODE_ENV === 'production'
    ? ':method :url :status :res[content-length] - :response-time ms - :req[x-request-id]'
    : 'dev';

  const loggerMiddleware = morgan(format, {
    skip: (req) => {
      // Skip health check logging in production
      return env.NODE_ENV === 'production' && req.url === '/health';
    },
  });

  return [requestIdMiddleware, loggerMiddleware];
}

module.exports = setupRequestLogger;
