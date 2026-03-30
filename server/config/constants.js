/**
 * @fileoverview Application-wide constants. No magic numbers anywhere else.
 * @module config/constants
 */

/** @description Maximum number of members allowed in a single group (BR-07) */
const MAX_GROUP_MEMBERS = 50;

/** @description Hours after creation during which an expense can be edited/deleted (BR-04) */
const EDIT_WINDOW_HOURS = 48;

/** @description Fields that cannot be modified after payments have been processed against an expense */
const IMMUTABLE_AFTER_PAYMENT = ['split_type', 'splits', 'total_amount_cents'];

/** @description Valid expense split types */
const SPLIT_TYPES = Object.freeze({
  EQUAL: 'equal',
  EXACT: 'exact',
  PERCENTAGE: 'percentage',
  SHARES: 'shares',
});

/** @description Valid payment settlement statuses */
const SETTLEMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed',
});

/** @description Valid payment methods */
const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other',
});

/** @description Group member roles */
const GROUP_ROLES = Object.freeze({
  ADMIN: 'admin',
  MEMBER: 'member',
});

/** @description Activity log action types */
const ACTION_TYPES = Object.freeze({
  EXPENSE_CREATED: 'expense_created',
  EXPENSE_UPDATED: 'expense_updated',
  EXPENSE_DELETED: 'expense_deleted',
  PAYMENT_CREATED: 'payment_created',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_DISPUTED: 'payment_disputed',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  MEMBER_ROLE_CHANGED: 'member_role_changed',
  GROUP_UPDATED: 'group_updated',
  GROUP_ARCHIVED: 'group_archived',
});

/** @description Entity types for activity log */
const ENTITY_TYPES = Object.freeze({
  EXPENSE: 'expense',
  PAYMENT: 'payment',
  GROUP: 'group',
  GROUP_MEMBER: 'group_member',
});

/** @description Notification types */
const NOTIFICATION_TYPES = Object.freeze({
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_UPDATED: 'expense_updated',
  EXPENSE_DELETED: 'expense_deleted',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_CONFIRMATION_REQUEST: 'payment_confirmation_request',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_DISPUTED: 'payment_disputed',
  GROUP_INVITATION: 'group_invitation',
  PAYMENT_REMINDER: 'payment_reminder',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
});

/** @description Application error codes */
const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
});

/** @description Default expense categories */
const EXPENSE_CATEGORIES = Object.freeze([
  'general',
  'food',
  'transport',
  'accommodation',
  'entertainment',
  'shopping',
  'utilities',
  'healthcare',
  'education',
  'other',
]);

/** @description Cookie names for JWT tokens */
const COOKIE_NAMES = Object.freeze({
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
});

/** @description Pagination defaults */
const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_ORDER: 'desc',
});

/** @description HTTP status codes for readability */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
});

module.exports = {
  MAX_GROUP_MEMBERS,
  EDIT_WINDOW_HOURS,
  SPLIT_TYPES,
  SETTLEMENT_STATUSES,
  PAYMENT_METHODS,
  GROUP_ROLES,
  ACTION_TYPES,
  ENTITY_TYPES,
  NOTIFICATION_TYPES,
  ERROR_CODES,
  EXPENSE_CATEGORIES,
  COOKIE_NAMES,
  HTTP_STATUS,
  IMMUTABLE_AFTER_PAYMENT,
};
