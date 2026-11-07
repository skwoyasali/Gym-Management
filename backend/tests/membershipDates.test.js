import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRechargeDates,
  dateKeyToUtcDate,
} from "../utils/membershipDates.js";
import { getDateKeyInTimeZone } from "../utils/gymDate.js";

test("active membership begins its recharge the day after expiry", () => {
  assert.deepEqual(
    calculateRechargeDates({
      membershipEnd: "2026-11-30",
      membershipActive: true,
      durationMonths: 1,
      today: "2026-11-20",
    }),
    { startDate: "2026-12-01", endDate: "2026-12-30" }
  );
});

test("expired membership begins on the current gym date", () => {
  assert.deepEqual(
    calculateRechargeDates({
      membershipEnd: "2026-11-19",
      membershipActive: true,
      durationMonths: 1,
      today: "2026-11-20",
    }),
    { startDate: "2026-11-20", endDate: "2026-12-19" }
  );
});

test("inactive membership does not preserve a future old expiry", () => {
  assert.deepEqual(
    calculateRechargeDates({
      membershipEnd: "2026-12-30",
      membershipActive: false,
      durationMonths: 1,
      today: "2026-11-20",
    }),
    { startDate: "2026-11-20", endDate: "2026-12-19" }
  );
});

test("30-day month durations handle multi-month and yearly plans", () => {
  const cases = [
    [3, "2027-02-28"],
    [6, "2027-05-29"],
    [12, "2027-11-25"],
  ];

  for (const [durationMonths, expectedEndDate] of cases) {
    const result = calculateRechargeDates({
      membershipEnd: "2026-11-30",
      membershipActive: true,
      durationMonths,
      today: "2026-11-20",
    });
    assert.equal(result.startDate, "2026-12-01");
    assert.equal(result.endDate, expectedEndDate);
  }
});

test("consecutive recharges extend from the previous approved expiry", () => {
  const first = calculateRechargeDates({
    membershipEnd: "2026-11-30",
    membershipActive: true,
    durationMonths: 1,
    today: "2026-11-20",
  });
  const second = calculateRechargeDates({
    membershipEnd: first.endDate,
    membershipActive: true,
    durationMonths: 3,
    today: "2026-11-20",
  });
  assert.deepEqual(second, {
    startDate: "2026-12-31",
    endDate: "2027-03-30",
  });
});

test("date-only membership values are stored at UTC midnight", () => {
  assert.equal(
    dateKeyToUtcDate("2026-12-01").toISOString(),
    "2026-12-01T00:00:00.000Z"
  );
});

test("gym-local calendar dates are used around UTC day boundaries", () => {
  const paymentTime = new Date("2026-12-01T04:30:00.000Z");
  assert.equal(getDateKeyInTimeZone(paymentTime, "Asia/Kolkata"), "2026-12-01");
  assert.equal(getDateKeyInTimeZone(paymentTime, "America/New_York"), "2026-11-30");
  assert.deepEqual(
    calculateRechargeDates({
      membershipActive: false,
      durationMonths: 1,
      today: paymentTime,
      timeZone: "America/New_York",
    }),
    { startDate: "2026-11-30", endDate: "2026-12-29" }
  );
});

test("invalid durations and dates are rejected", () => {
  assert.throws(
    () =>
      calculateRechargeDates({
        durationMonths: 0,
        membershipActive: false,
        today: "2026-11-20",
      }),
    /duration/
  );
  assert.throws(
    () =>
      calculateRechargeDates({
        durationMonths: 1,
        membershipActive: false,
        today: "2026-02-30",
      }),
    /Invalid membership date/
  );
});
