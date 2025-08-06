// Sets up the API client for interacting with your backend.
// For your API reference, visit: https://docs.gadget.dev/api/verifly
import { Client } from "@gadget-client/verifly";

export const api = new Client({ environment: window.gadgetConfig.environment });

/**
 * Capitalizes the first letter of each segment in a hyphen-separated string and removes the hyphens.
 * Example: 'fort-knox' => 'Fort Knox'
 * @param {string} str - The input string to capitalize and join.
 * @returns {string} The capitalized, joined string.
 */
export const capitalizeString = (str) => {
  if (str == null) {
    return '';
  }
  return String(str)
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export const getDaysUntilTimestamp = (date, daysOffset = 0) => {
  const now = Date.now();
  const timestamp = date.getTime();
  const diffInMs = timestamp - now;
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + daysOffset;

  return diffInDays;
};