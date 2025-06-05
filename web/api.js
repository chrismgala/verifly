// Sets up the API client for interacting with your backend.
// For your API reference, visit: https://docs.gadget.dev/api/verifly
import { Client } from "@gadget-client/verifly";

export const api = new Client({ environment: window.gadgetConfig.environment });

export const capitalizeString = (str) => {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
};

export const getDaysUntilTimestamp = (date, daysOffset = 0) => {
  const now = Date.now();
  const timestamp = date.getTime();
  const diffInMs = timestamp - now;
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + daysOffset;

  return diffInDays;
};