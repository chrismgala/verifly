/**
 * Capitalizes the first letter of each segment in a hyphen-separated string and removes the hyphens.
 * Example: 'fort-knox' => 'Fort Knox'
 * @param {string} string - The input string to capitalize and join.
 * @param {boolean} hyphens - Whether to split the string by hyphens.
 * @returns {string} The capitalized, joined string.
 */
export const capitalizeString = (string, hyphens) => {
  if (string == null) return '';

  let splitValue = ' ';
  if (hyphens) {
    splitValue = '-';
  }
  
  return String(string)
    .split(splitValue)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

/**
 * Normalizes camel case to a space-separated string.
 * Example: 'firstName' => 'First Name'
 * @param {string} string - The input string to normalize.
 * @returns {string} The normalized string.
 */
export const normalizeCamelCase = (string) => {
  return string.replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
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