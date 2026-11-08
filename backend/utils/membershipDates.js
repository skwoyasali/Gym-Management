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

export const isValidMembershipDateRange = (record) => {
  const start = toDateKey(record?.membershipStart);
  const end = toDateKey(record?.membershipEnd);
  return Boolean(start && end && start <= end);
};

export const selectLatestMembershipRecord = (records = [], { today } = {}) => {
  const todayKey = today ? toDateKey(today) : null;
  return records
    .filter(
      (record) =>
        record.approvalStatus === "approved" &&
        isValidMembershipDateRange(record) &&
        (!todayKey || toDateKey(record.membershipEnd) >= todayKey)
    )
    .sort((first, second) => {
      const endDifference =
        toDateKey(second.membershipEnd).localeCompare(
          toDateKey(first.membershipEnd)
        );
      if (endDifference) return endDifference;
      return toDateKey(second.membershipStart).localeCompare(
        toDateKey(first.membershipStart)
      );
    })[0] || null;
};

const addDaysToDateKey = (dateKey, days) => {
  const bounds = getUtcDayBounds(dateKey);
  if (!bounds) throw new Error("Invalid membership date");
  const result = new Date(bounds.start);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

export const getPlanDurationDays = (durationMonths) => {
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
    throw new Error("Membership duration must be between 1 and 120 months");
  }
  return durationMonths === 12 ? 365 : durationMonths * 30;
};

export const calculateRechargeDates = ({
  membershipEnd,
  membershipActive,
  durationDays,
  today = new Date(),
  timeZone,
}) => {
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new Error("Membership duration must be a positive number of days");
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
    membershipActive && previousEndKey && previousEndKey > todayKey
      ? addDaysToDateKey(previousEndKey, 1)
      : todayKey;
  const endDate = addDaysToDateKey(startDate, durationDays - 1);

  return { startDate, endDate };
};

export const dateKeyToUtcDate = (dateKey) => {
  const bounds = getUtcDayBounds(dateKey);
  if (!bounds) throw new Error("Invalid membership date");
  return bounds.start;
};
