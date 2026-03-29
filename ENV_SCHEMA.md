# SplitSmart — Environment Variables Schema

**Version:** 1.0  
**Date:** 2026-03-29  
**Companion to:** SYSTEM_DESIGN.md v1.0  

---

## Legend

| Column | Description |
|---|---|
| **Variable** | Environment variable name |
| **Required** | Whether the app will fail to start without it |
| **Secret** | Whether it contains sensitive data (must not be committed to VCS) |
| **Description** | What it controls |
| **Example** | Representative value (secrets use placeholder format) |

---

## 1. Server

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `NODE_ENV` | Yes | No | Runtime environment; controls logging verbosity, error detail, and feature flags | `development` \| `staging` \| `production` |
| `PORT` | No | No | HTTP server listen port (default: `3000`) | `3000` |
| `API_VERSION` | No | No | Default API version prefix (default: `v1`) | `v1` |
| `LOG_LEVEL` | No | No | Pino log level (default: `info` in prod, `debug` in dev) | `info` \| `debug` \| `warn` \| `error` |

## 2. Database

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | Yes | PostgreSQL connection string (used by Prisma) | `postgresql://user:pass@localhost:5432/splitsmart?schema=public` |
| `DATABASE_POOL_SIZE` | No | No | Max connections in the Prisma connection pool (default: `10`) | `10` |
| `DATABASE_READ_REPLICA_URL` | No | Yes | Read replica connection string for read-heavy queries (optional; used in growth phase) | `postgresql://user:pass@replica:5432/splitsmart?schema=public` |

## 3. Redis

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `REDIS_URL` | Yes | Yes | Redis connection string for caching, sessions, rate limiting, Socket.IO adapter, and BullMQ | `redis://:password@localhost:6379/0` |

## 4. Authentication

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `JWT_ACCESS_SECRET` | Yes | Yes | HMAC secret for signing access tokens; minimum 256-bit entropy | `sk_access_a1b2c3d4e5f6...` |
| `JWT_REFRESH_SECRET` | Yes | Yes | HMAC secret for signing refresh tokens; must differ from access secret | `sk_refresh_f6e5d4c3b2a1...` |
| `JWT_ACCESS_EXPIRY` | No | No | Access token lifetime (default: `15m`) | `15m` |
| `JWT_REFRESH_EXPIRY` | No | No | Refresh token lifetime (default: `7d`) | `7d` |
| `BCRYPT_SALT_ROUNDS` | No | No | bcrypt cost factor for password hashing (default: `12`) | `12` |

## 5. CORS

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `CORS_ORIGINS` | Yes | No | Comma-separated list of allowed origins for CORS; no wildcards in production | `https://splitsmart.app,https://www.splitsmart.app` |

## 6. File Storage (S3-Compatible)

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `S3_BUCKET` | Yes | No | Bucket name for receipt image uploads | `splitsmart-receipts-prod` |
| `S3_REGION` | Yes | No | AWS region (or compatible provider region) | `ap-south-1` |
| `S3_ACCESS_KEY_ID` | Yes | Yes | IAM access key for S3 operations | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_ACCESS_KEY` | Yes | Yes | IAM secret key for S3 operations | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_ENDPOINT` | No | No | Custom endpoint URL for S3-compatible providers (e.g., MinIO, R2) | `https://s3.example.com` |
| `UPLOAD_MAX_FILE_SIZE_MB` | No | No | Maximum file upload size in megabytes (default: `10`) | `10` |
| `PRESIGNED_URL_EXPIRY_SECONDS` | No | No | Pre-signed URL validity for receipt downloads (default: `3600`) | `3600` |

## 7. External Services

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `EXCHANGE_RATE_API_KEY` | No | Yes | API key for exchange rate provider (required only when multi-currency is enabled, P1-03) | `exr_live_abc123def456` |
| `EXCHANGE_RATE_API_URL` | No | No | Base URL for exchange rate API (default: `https://api.exchangerate.host`) | `https://api.exchangerate.host` |
| `PUSH_NOTIFICATION_KEY` | No | Yes | Firebase Cloud Messaging or equivalent service key (required when push notifications are enabled) | `fcm_server_key_abc123...` |

## 8. Rate Limiting

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | No | No | Default rate limit window in milliseconds (default: `60000` = 1 minute) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | No | Default max requests per window for authenticated users (default: `100`) | `100` |
| `RATE_LIMIT_LOGIN_MAX` | No | No | Max login attempts per 15-minute window per IP (default: `5`) | `5` |

## 9. Feature Flags

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `ENABLE_SOCIAL_LOGIN` | No | No | Enable Google/Apple social login (default: `false`) | `true` \| `false` |
| `ENABLE_PUSH_NOTIFICATIONS` | No | No | Enable push notification dispatch (default: `false`) | `true` \| `false` |
| `ENABLE_MULTI_CURRENCY` | No | No | Enable multi-currency expense support (default: `false`; requires `EXCHANGE_RATE_API_KEY`) | `true` \| `false` |
| `ENABLE_RECURRING_EXPENSES` | No | No | Enable recurring expense scheduler (default: `false`) | `true` \| `false` |

## 10. Social Login (conditional on `ENABLE_SOCIAL_LOGIN=true`)

| Variable | Required | Secret | Description | Example |
|---|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Conditional | No | Google OAuth 2.0 client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Conditional | Yes | Google OAuth 2.0 client secret | `GOCSPX-abc123def456` |
| `APPLE_CLIENT_ID` | Conditional | No | Apple Sign-In service ID | `com.splitsmart.auth` |
| `APPLE_TEAM_ID` | Conditional | No | Apple Developer Team ID | `ABCDE12345` |
| `APPLE_KEY_ID` | Conditional | No | Apple Sign-In key ID | `KEY12345` |
| `APPLE_PRIVATE_KEY` | Conditional | Yes | Apple Sign-In private key (PEM format) | `-----BEGIN PRIVATE KEY-----\n...` |

---

## Validation Rules

The server must validate all environment variables at startup using Zod (in `server/src/config/index.ts`). Validation rules:

1. **All `Required: Yes` variables** must be present and non-empty. Missing variables cause an immediate startup failure with a clear error message listing all missing vars.
2. **Secret variables** must be at least 32 characters long (except structured values like URLs and PEM keys).
3. **`NODE_ENV`** must be one of: `development`, `staging`, `production`, `test`.
4. **URL variables** (`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`) must be valid URL format.
5. **Numeric variables** (`PORT`, `DATABASE_POOL_SIZE`, `BCRYPT_SALT_ROUNDS`) must parse to positive integers.
6. **Duration variables** (`JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`) must match pattern: `\d+[smhd]` (seconds/minutes/hours/days).
7. **Conditional variables** are validated only when their feature flag is enabled.

---

## .env.example

```env
# ============================================================
# SplitSmart Environment Configuration
# Copy this file to .env and fill in the values
# ============================================================

# --- Server ---
NODE_ENV=development
PORT=3000
API_VERSION=v1
LOG_LEVEL=debug

# --- Database ---
DATABASE_URL=postgresql://splitsmart:password@localhost:5432/splitsmart_dev?schema=public
DATABASE_POOL_SIZE=10

# --- Redis ---
REDIS_URL=redis://localhost:6379/0

# --- Authentication ---
JWT_ACCESS_SECRET=CHANGE_ME_access_secret_min_32_chars
JWT_REFRESH_SECRET=CHANGE_ME_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# --- CORS ---
CORS_ORIGINS=http://localhost:5173

# --- File Storage (S3) ---
S3_BUCKET=splitsmart-receipts-dev
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=CHANGE_ME
S3_SECRET_ACCESS_KEY=CHANGE_ME

# --- Rate Limiting ---
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5

# --- Feature Flags ---
ENABLE_SOCIAL_LOGIN=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_MULTI_CURRENCY=false
ENABLE_RECURRING_EXPENSES=false
```

---

*End of Document*
