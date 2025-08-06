import { differenceInMinutes } from "date-fns";

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

export const trialCalculations = (
  usedTrialMinutes = 0,
  usedTrialMinutesUpdatedAt,
  today,
  defaultTrialDays
) => {
  const usedMinutes =
    differenceInMinutes(
      today,
      usedTrialMinutesUpdatedAt ? new Date(usedTrialMinutesUpdatedAt) : today
    ) + usedTrialMinutes;

  return {
    usedTrialMinutes: Math.min(defaultTrialDays * 24 * 60, usedMinutes),
    availableTrialDays: Math.max(
      0,
      Math.round(defaultTrialDays - usedMinutes / 60 / 24)
    ),
  };
};

export const getDaysUntilTimestamp = (date, daysOffset = 0) => {
  const now = Date.now();
  const timestamp = date.getTime();
  const diffInMs = timestamp - now;
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + daysOffset;

  return diffInDays;
};
