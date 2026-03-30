/**
 * @fileoverview Re-export design tokens for use within JS logic.
 * E.g., for charting libraries or inline styles requiring exact hex codes.
 * @module design-system
 */

import tokens from './tokens';

export const COLORS = tokens.colors;
export const TYPOGRAPHY = tokens.typography;
export const SPACING = tokens.spacing;
export const RADII = tokens.borderRadius;
export const SHADOWS = tokens.shadows;
export const Z_INDEX = tokens.zIndex;

export default tokens;
