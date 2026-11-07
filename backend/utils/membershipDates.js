import { getDateKeyInTimeZone, getUtcDayBounds } from "./gymDate.js";

const toDateKey = (value) => {
  const dateKey =
    typeof value === "string"
      ? value.slice(0, 10)
      : value instanceof Date
        ? value.toISOString().slice(0, 10)
        : "";
  return getUtcDayBounds(dateKey) ? dateKey : null;
};

const addDaysToDateKey = (dateKey, days) => {
  const bounds = getUtcDayBounds(dateKey);
  if (!bounds) throw new Error("Invalid membership date");
  const result = new Date(bounds.start);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

export const calculateRechargeDates = ({
  membershipEnd,
  membershipActive,
  durationMonths,
  today = new Date(),
  timeZone,
}) => {
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
    throw new Error("Membership duration must be between 1 and 120 months");
  }

  let todayKey;
  if (typeof today === "string") {
    if (!getUtcDayBounds(today)) throw new Error("Invalid membership date");
    todayKey = today;
  } else if (today instanceof Date && !Number.isNaN(today.getTime())) {
    todayKey = getDateKeyInTimeZone(today, timeZone);
  } else {
    throw new Error("Invalid membership date");
  }
  const previousEndKey = toDateKey(membershipEnd);
  const startDate =
    membershipActive && previousEndKey && previousEndKey >= todayKey
      ? addDaysToDateKey(previousEndKey, 1)
      : todayKey;
  const endDate = addDaysToDateKey(startDate, durationMonths * 30 - 1);

  return { startDate, endDate };
};

export const dateKeyToUtcDate = (dateKey) => {
  const bounds = getUtcDayBounds(dateKey);
  if (!bounds) throw new Error("Invalid membership date");
  return bounds.start;
};
