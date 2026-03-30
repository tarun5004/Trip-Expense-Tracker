/**
 * @module app
 * @description Express application setup. Does NOT start listening —
 *              that is server.js's responsibility.
 *              This separation enables easy testing.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Assuming middleware exist from previous backend stages (stubs if not present)
// const requestLogger = require('./middleware/requestLogger');
// const rateLimiter = require('./middleware/rateLimiter');
// const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS setup
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true, // Crucial for httpOnly refresh cookies
}));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trace ID Injection (Matches frontend X-Request-ID)
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  next();
});

// 4. Custom Request Logger
// app.use(requestLogger);

// 5. Global Rate Limiter
// app.use(rateLimiter);

// Health check endpoint (Used by Docker)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// 6. Mount API Routes
// const routes = require('./routes'); 
// app.use('/api/v1', routes);

// 7. 404 Handler for unmatched paths
app.use((req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// 8. Global Error Handler (MUST BE LAST)
// app.use(errorHandler);

module.exports = app;
