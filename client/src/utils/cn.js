/**
 * @fileoverview Utility for intelligently merging Tailwind CSS classes.
 * Overcomes specific specificity issues, merges identical classes, and resolves conflicts.
 * @module utils/cn
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names resolving conflicts over standard concatenations.
 * Uses clsx for object/array joining, and tailwind-merge to deduplicate.
 * 
 * @param {...(string | undefined | null | false | Record<string, boolean>)} inputs
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
