/**
 * @fileoverview Balance service — balance computation with debt simplification.
 * @module services/balance.service
 */

const balanceModel = require('../models/balance.model');
const groupModel = require('../models/group.model');
const { calculateGroupBalances } = require('./expenseEngine/balanceCalculator');
const { simplifyDebts } = require('./expenseEngine/debtSimplifier');
const ApiError = require('../utils/ApiError');
const { redis } = require('../config/redis');

const BALANCE_CACHE_PREFIX = 'group:balances:';
const CACHE_TTL = 300; // 5 minutes

/**
 * @description Get raw pairwise balances for a group.
 * Verifies membership, checks Redis cache first, computes from DB if miss.
 * @usedBy balance.controller.js → getGroupBalances
 * @param {string} userId - Requesting user's UUID
 * @param {string} groupId - Group UUID
 * @returns {Promise<Array<{ debtorId: string, creditorId: string, amountCents: number }>>}
 * @throws {ApiError} 403 if not a group member
 */
async function getGroupBalances(userId, groupId) {
  // Verify membership
  const memberCheck = await groupModel.isMember(groupId, userId);
  if (!memberCheck) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  // Check Redis cache
  const cacheKey = `${BALANCE_CACHE_PREFIX}${groupId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    // Redis error — continue without cache
    console.warn('Redis cache read failed:', err.message);
  }

  // Compute from database
  const rawBalances = await balanceModel.getGroupBalances(groupId);
  const balances = calculateGroupBalances(rawBalances);

  // Cache the result
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(balances));
  } catch (err) {
    console.warn('Redis cache write failed:', err.message);
  }

  return balances;
}

/**
 * @description Get simplified (minimum-transactions) balances for a group.
 * Uses the debt simplification algorithm from the expense engine.
 * @usedBy balance.controller.js → getSimplifiedBalances
 * @param {string} userId - Requesting user's UUID
 * @param {string} groupId - Group UUID
 * @returns {Promise<Array<{ from: string, to: string, amountCents: number }>>} Simplified settlement plan
 * @throws {ApiError} 403 if not a group member
 */
async function getSimplifiedBalances(userId, groupId) {
  // Verify membership
  const memberCheck = await groupModel.isMember(groupId, userId);
  if (!memberCheck) {
    throw ApiError.forbidden('You are not a member of this group');
  }

  // Check simplified cache
  const cacheKey = `${BALANCE_CACHE_PREFIX}simplified:${groupId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Redis cache read failed:', err.message);
  }

  // Get raw balances and simplify
  const rawBalances = await balanceModel.getGroupBalances(groupId);
  const pairwise = calculateGroupBalances(rawBalances);
  const simplified = simplifyDebts(pairwise);

  // Cache
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(simplified));
  } catch (err) {
    console.warn('Redis cache write failed:', err.message);
  }

  return simplified;
}

/**
 * @description Invalidate balance caches for a group.
 * Called after any expense or payment mutation.
 * @usedBy expense.service.js, payment.service.js
 * @param {string} groupId - Group UUID
 * @returns {Promise<void>}
 */
async function invalidateBalanceCache(groupId) {
  try {
    await redis.del(`${BALANCE_CACHE_PREFIX}${groupId}`);
    await redis.del(`${BALANCE_CACHE_PREFIX}simplified:${groupId}`);
  } catch (err) {
    console.warn('Redis cache invalidation failed:', err.message);
  }
}

module.exports = { getGroupBalances, getSimplifiedBalances, invalidateBalanceCache };
