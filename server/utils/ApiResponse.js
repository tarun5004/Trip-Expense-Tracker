/**
 * @fileoverview Standard API response formatter.
 * Every API response goes through this class for consistent envelope structure.
 * @module utils/ApiResponse
 */

const { v4: uuidv4 } = require('uuid');
const { HTTP_STATUS } = require('../config/constants');

class ApiResponse {
  /**
   * @description Send a success response with standard envelope.
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Response payload
   * @param {string} [message='Success'] - Human-readable success message
   * @param {number} [statusCode=200] - HTTP status code
   * @param {object} [meta={}] - Additional metadata (pagination, counts, etc.)
   * @returns {import('express').Response} Express response
   */
  static success(res, data, message = 'Success', statusCode = HTTP_STATUS.OK, meta = {}) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      meta,
      requestId: res.req?.requestId || uuidv4(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * @description Send a created (201) response.
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Created resource payload
   * @param {string} [message='Resource created successfully'] - Message
   * @returns {import('express').Response} Express response
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * @description Send a no-content (204) response.
   * @param {import('express').Response} res - Express response object
   * @returns {import('express').Response} Express response
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).end();
  }

  /**
   * @description Send a paginated success response with cursor metadata.
   * @param {import('express').Response} res - Express response object
   * @param {Array} data - Array of result items
   * @param {object} pagination - Pagination metadata from buildPaginationMeta()
   * @param {string} [message='Success'] - Message
   * @returns {import('express').Response} Express response
   */
  static paginated(res, data, pagination, message = 'Success') {
    return ApiResponse.success(res, data, message, HTTP_STATUS.OK, { pagination });
  }
}

module.exports = ApiResponse;
