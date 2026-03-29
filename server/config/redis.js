/**
 * @fileoverview Redis client setup using ioredis with reconnect handling.
 * Provides a singleton Redis client for caching, sessions, and rate limiting.
 * @module config/redis
 */

const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.warn(`⚠️ Redis reconnect attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  if (env.NODE_ENV === 'development') {
    console.log('📦 Redis ready to accept commands');
  }
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed');
});

/**
 * @description Test Redis connection by sending a PING command.
 * @returns {Promise<boolean>} true if connected
 */
async function testRedisConnection() {
  const pong = await redis.ping();
  console.log('✅ Redis PING response:', pong);
  return pong === 'PONG';
}

/**
 * @description Gracefully close the Redis connection.
 * @returns {Promise<void>}
 */
async function closeRedis() {
  await redis.quit();
  console.log('🔌 Redis connection closed');
}

module.exports = { redis, testRedisConnection, closeRedis };
