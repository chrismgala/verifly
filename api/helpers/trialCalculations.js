import { differenceInMinutes } from "date-fns";

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
