/**
 * @fileoverview Password hashing (bcrypt) and token hashing (SHA-256) utilities.
 * @module utils/hash
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * @description Hash a plain-text password using bcrypt with configured salt rounds.
 * @param {string} password - The plain-text password
 * @returns {Promise<string>} bcrypt hash string
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * @description Compare a plain-text password against a bcrypt hash.
 * @param {string} password - The plain-text password to check
 * @param {string} hash - The bcrypt hash to compare against
 * @returns {Promise<boolean>} true if the password matches the hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * @description Create a SHA-256 hash of a token for secure storage.
 * Refresh tokens are stored as hashes in the sessions table — never raw.
 * @param {string} token - The token string to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashPassword, comparePassword, hashToken };
