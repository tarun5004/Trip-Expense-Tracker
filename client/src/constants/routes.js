/**
 * @fileoverview Single source of truth for frontend route paths.
 * @module constants/routes
 */

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  GROUPS: '/groups',
  GROUP_DETAIL: (groupId = ':groupId') => `/groups/${groupId}`,
  GROUP_MEMBERS: (groupId = ':groupId') => `/groups/${groupId}/members`,
  ADD_EXPENSE: (groupId = ':groupId') => `/groups/${groupId}/expenses/new`,
  EXPENSE_DETAIL: (groupId = ':groupId', expenseId = ':expenseId') => `/groups/${groupId}/expenses/${expenseId}`,
  SETTLE_UP: (groupId = ':groupId') => `/groups/${groupId}/settle`,
  ACTIVITY: '/activity',
  PROFILE: '/profile',
};

export default ROUTES;
