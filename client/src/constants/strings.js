/**
 * @fileoverview Single source of truth for all UI strings (i18n ready).
 * @module constants/strings
 */

export const STRINGS = {
  // App General
  APP_NAME: 'SplitSmart',
  TAGLINE: 'Expense splitting, simplified.',
  LOADING: 'Loading...',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  RETRY: 'Retry',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  DELETE: 'Delete',
  EDIT: 'Edit',
  NEXT: 'Next',
  BACK: 'Back',

  // Auth
  AUTH_LOGIN: 'Log in',
  AUTH_REGISTER: 'Sign up',
  AUTH_EMAIL_LABEL: 'Email',
  AUTH_PASSWORD_LABEL: 'Password',
  AUTH_NAME_LABEL: 'Full Name',

  // Dashboard
  DASHBOARD_WELCOME: 'Welcome back',
  DASHBOARD_TOTAL_BALANCE: 'Total Balance',
  DASHBOARD_YOU_OWE: 'You owe',
  DASHBOARD_YOU_ARE_OWED: 'You are owed',
  DASHBOARD_RECENT_ACTIVITY: 'Recent Activity',
  DASHBOARD_NEW_EXPENSE: 'Add Expense',
  DASHBOARD_TOP_GROUPS: 'Your Groups',

  // Groups
  GROUP_MEMBERS: 'Members',
  GROUP_EXPENSES: 'Expenses',
  GROUP_BALANCES: 'Balances',
  GROUP_SETTLE_UP: 'Settle Up',
  GROUP_ADD_MEMBER: 'Add Member',

  // Expenses
  EXPENSE_ADD_TITLE: 'Add a new expense',
  EXPENSE_AMOUNT_LABEL: 'Total Amount',
  EXPENSE_DESCRIPTION_LABEL: 'What was this for?',
  EXPENSE_DATE_LABEL: 'Date',
  EXPENSE_GROUP_LABEL: 'Group',
  EXPENSE_PAID_BY_LABEL: 'Who paid?',
  EXPENSE_SPLIT_TITLE: 'How should this be split?',

  // Split Types
  SPLIT_EQUAL: 'Equally',
  SPLIT_EXACT: 'Exact amounts',
  SPLIT_PERCENTAGE: 'Percentages',
  SPLIT_SHARES: 'Shares',

  // Settlement
  SETTLE_UP_TITLE: 'Settle Up',
  SETTLE_UP_PAYEE: 'Who are you paying?',
  SETTLE_UP_AMOUNT: 'How much?',
  SETTLE_UP_METHOD: 'Payment Method',
  SETTLE_UP_NOTE: 'Add a note (optional)',
  SETTLE_UP_CONFIRM: 'Record Payment',

  // Empty States
  EMPTY_GROUPS_TITLE: 'No groups yet',
  EMPTY_GROUPS_DESC: 'Create a group to start sharing expenses.',
  EMPTY_EXPENSES_TITLE: 'No expenses here',
  EMPTY_EXPENSES_DESC: 'Be the first to add an expense.',
  EMPTY_BALANCES_TITLE: 'All settled up!',
  EMPTY_BALANCES_DESC: 'Nobody owes anything right now.',
};

export default STRINGS;
