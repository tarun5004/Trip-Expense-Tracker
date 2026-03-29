/**
 * @fileoverview Cursor-based and offset pagination helpers.
 * @module utils/pagination
 */

const { PAGINATION } = require('../config/constants');

/**
 * @description Parse and validate pagination parameters from query string.
 * @param {object} query - Express req.query object
 * @returns {{ limit: number, cursor: string|null, sortBy: string, sortOrder: string }}
 */
function parsePaginationParams(query) {
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION.DEFAULT_LIMIT;
  }
  if (limit > PAGINATION.MAX_LIMIT) {
    limit = PAGINATION.MAX_LIMIT;
  }

  const cursor = query.cursor || null;
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : PAGINATION.DEFAULT_SORT_ORDER;

  return { limit, cursor, sortBy, sortOrder };
}

/**
 * @description Build pagination metadata for cursor-based results.
 * @param {Array} results - Query result rows (should fetch limit+1 to detect hasMore)
 * @param {number} limit - Requested page size
 * @param {string|null} currentCursor - Current cursor value
 * @returns {{ limit: number, nextCursor: string|null, hasMore: boolean }}
 */
function buildPaginationMeta(results, limit, currentCursor) {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    limit,
    nextCursor,
    hasMore,
  };
}

/**
 * @description Encode a cursor value to base64 for opaque cursor strings.
 * @param {string} value - Raw cursor value (typically a UUID)
 * @returns {string} Base64-encoded cursor
 */
function encodeCursor(value) {
  return Buffer.from(String(value)).toString('base64');
}

/**
 * @description Decode a base64 cursor string back to its raw value.
 * @param {string} cursor - Base64-encoded cursor
 * @returns {string} Decoded cursor value
 */
function decodeCursor(cursor) {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  encodeCursor,
  decodeCursor,
};
