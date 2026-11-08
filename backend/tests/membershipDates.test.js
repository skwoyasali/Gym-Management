import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRechargeDates,
  dateKeyToUtcDate,
  getPlanDurationDays,
  selectLatestMembershipRecord,
} from "../utils/membershipDates.js";
import { getDateKeyInTimeZone } from "../utils/gymDate.js";

const calculate = ({ membershipEnd, durationDays = 30, today = "2026-11-07" }) =>
  calculateRechargeDates({
    membershipEnd,
    membershipActive: Boolean(membershipEnd),
    durationDays,
    today,
  });

test("active membership with 23 days remaining starts after its expiry", () => {
  assert.deepEqual(
    calculate({ membershipEnd: "2026-11-30" }),
    { startDate: "2026-12-01", endDate: "2026-12-30" }
  );
});

test("membership with one remaining day after today starts after expiry", () => {
  assert.deepEqual(
    calculate({
      membershipEnd: "2026-11-08",
      today: "2026-11-07",
    }),
    { startDate: "2026-11-09", endDate: "2026-12-08" }
  );
});

test("membership expiring today starts the new plan today", () => {
  assert.deepEqual(
    calculate({ membershipEnd: "2026-11-07" }),
    { startDate: "2026-11-07", endDate: "2026-12-06" }
  );
});

test("membership expired yesterday starts the new plan today", () => {
  assert.deepEqual(
    calculate({ membershipEnd: "2026-11-06" }),
    { startDate: "2026-11-07", endDate: "2026-12-06" }
  );
});

test("a member with no previous membership starts today", () => {
  assert.deepEqual(
    calculate({ membershipEnd: null }),
    { startDate: "2026-11-07", endDate: "2026-12-06" }
  );
});

test("three consecutive recharges chain from the latest approved expiry", () => {
  const first = calculate({
    membershipEnd: "2026-11-30",
    durationDays: 30,
  });
  const second = calculate({
    membershipEnd: first.endDate,
    durationDays: 90,
  });
  const third = calculate({
    membershipEnd: second.endDate,
    durationDays: 180,
  });

  assert.deepEqual(first, {
    startDate: "2026-12-01",
    endDate: "2026-12-30",
  });
  assert.deepEqual(second, {
    startDate: "2026-12-31",
    endDate: "2027-03-30",
  });
  assert.deepEqual(third, {
    startDate: "2027-03-31",
    endDate: "2027-09-26",
  });
});

test("plan durations use 30, 90, 180 and 365 days", () => {
  assert.deepEqual(
    [1, 3, 6, 12].map(getPlanDurationDays),
    [30, 90, 180, 365]
  );

  for (const [durationMonths, durationDays] of [
    [1, 30],
    [3, 90],
    [6, 180],
    [12, 365],
  ]) {
    const result = calculate({
      membershipEnd: null,
      durationDays: getPlanDurationDays(durationMonths),
    });
    const expectedEnd = new Date("2026-11-07T00:00:00.000Z");
    expectedEnd.setUTCDate(expectedEnd.getUTCDate() + durationDays - 1);
    assert.equal(result.endDate, expectedEnd.toISOString().slice(0, 10));
  }
});

test("latest valid approved membership is selected by expiry, not input order", () => {
  const expired = {
    approvalStatus: "approved",
    membershipStart: "2026-01-01",
    membershipEnd: "2026-10-31",
  };
  const later = {
    approvalStatus: "approved",
    membershipStart: "2027-01-01",
    membershipEnd: "2027-03-31",
  };
  const current = {
    approvalStatus: "approved",
    membershipStart: "2026-11-01",
    membershipEnd: "2026-11-30",
  };
  const rejected = {
    approvalStatus: "rejected",
    membershipStart: "2027-04-01",
    membershipEnd: "2027-04-30",
  };
  const invalidRange = {
    approvalStatus: "approved",
    membershipStart: "2027-05-01",
    membershipEnd: "2027-04-30",
  };

  assert.equal(
    selectLatestMembershipRecord([
      expired,
      current,
      later,
      rejected,
      invalidRange,
    ]),
    later
  );
  assert.equal(
    selectLatestMembershipRecord([expired, current, later], {
      today: "2026-11-07",
    }),
    later
  );
  assert.equal(
    selectLatestMembershipRecord([expired, current], {
      today: "2026-11-07",
    }),
    current
  );
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
      durationDays: 30,
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
        durationDays: 0,
        membershipActive: false,
        today: "2026-11-20",
      }),
    /duration/
  );
  assert.throws(
    () =>
      calculateRechargeDates({
        durationDays: 30,
        membershipActive: false,
        today: "2026-02-30",
      }),
    /Invalid membership date/
  );
});
