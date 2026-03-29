/**
 * @fileoverview Express application setup.
 * Configures middleware stack, mounts routes, sets up error handling.
 * Does NOT call listen() — that's in server.js.
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const setupRequestLogger = require('./middleware/requestLogger');
const { generalLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

const app = express();

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Request Logging ──────────────────────────────────────────
const [requestIdMiddleware, loggerMiddleware] = setupRequestLogger();
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// ─── General Rate Limiting ────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, routes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// ─── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
