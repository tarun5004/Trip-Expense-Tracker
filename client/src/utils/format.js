/**
 * @fileoverview Core formatting utilities corresponding strictly with the API's integer Cents.
 * @module utils/format
 */

/**
 * Converts stored cents to frontend-friendly fractional decimal strings.
 * @param {number} cents 
 * @returns {string} String float equivalent (e.g. 1050 -> "10.50")
 */
export const fromCents = (cents) => {
  if (typeof cents !== 'number') return '0.00';
  return (cents / 100).toFixed(2);
};

/**
 * Formats cents into localized currency strings for UI display.
 * @param {number} amountCents - Integer cents
 * @param {string} [currencyCode='INR'] - Currency code
 * @param {string} [locale='en-IN'] - User locale
 * @returns {string} Localized string (e.g. ₹10.50)
 */
export const formatCurrency = (amountCents, currencyCode = 'INR', locale = 'en-IN') => {
  if (typeof amountCents !== 'number') return '';
  const val = amountCents / 100;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(val);
  } catch {
    return `${currencyCode} ${val.toFixed(2)}`;
  }
};

/**
 * Formats a Date payload into short or relative localized UI strings.
 * @param {string | Date} dateInput
 * @param {object} [options] 
 * @returns {string} Formatted Date string
 */
export const formatDate = (dateInput, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', options).format(d);
  } catch {
    return '';
  }
};

/**
 * Returns initials from a full name.
 * @param {string} name 
 * @returns {string} One or two letter initials 
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
