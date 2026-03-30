/**
 * @fileoverview Environment variable validation and export.
 * Uses Zod to validate ALL env vars at startup — fail-fast on misconfiguration.
 * @module config/env
 */

const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const durationRegex = /^\d+[smhd]$/;

const envSchema = z.object({
  // --- Server ---
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().int().positive()),
  API_VERSION: z.string().default('v1'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // --- Database ---
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DATABASE_POOL_SIZE: z.string().default('10').transform(Number).pipe(z.number().int().positive()),

  // --- Redis ---
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // --- Authentication ---
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().regex(durationRegex, 'JWT_ACCESS_EXPIRES must match pattern: \\d+[smhd]').default('15m'),
  JWT_REFRESH_EXPIRES: z.string().regex(durationRegex, 'JWT_REFRESH_EXPIRES must match pattern: \\d+[smhd]').default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number).pipe(z.number().int().min(4).max(20)),

  // --- CORS ---
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required'),

  // --- File Storage ---
  S3_BUCKET: z.string().default(''),
  S3_REGION: z.string().default('ap-south-1'),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),

  // --- Rate Limiting ---
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_LOGIN_MAX: z.string().default('5').transform(Number).pipe(z.number().int().positive()),

  // --- Feature Flags ---
  ENABLE_SOCIAL_LOGIN: z.string().default('false').transform((v) => v === 'true'),
  ENABLE_PUSH_NOTIFICATIONS: z.string().default('false').transform((v) => v === 'true'),
  ENABLE_MULTI_CURRENCY: z.string().default('false').transform((v) => v === 'true'),
  ENABLE_RECURRING_EXPENSES: z.string().default('false').transform((v) => v === 'true'),
});

/**
 * @description Validate and parse environment variables from process.env using Zod.
 * Will terminate the process if any required variables are missing or invalid.
 * @returns {z.infer<typeof envSchema>} Validated env config object
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('❌ Environment validation failed:\n' + formatted);
    process.exit(1);
  }

  return Object.freeze(result.data);
}

const env = validateEnv();

module.exports = env;
