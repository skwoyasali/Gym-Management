import test from "node:test";
import assert from "node:assert/strict";
import { calculateGymProCharge } from "../utils/createGymBilling.js";

test("GymPro charges are calculated from membership duration and monthly rate", () => {
  assert.equal(calculateGymProCharge(1, 50), 50);
  assert.equal(calculateGymProCharge(3, 50), 150);
  assert.equal(calculateGymProCharge(6, 50), 300);
  assert.equal(calculateGymProCharge(12, 50), 600);
});

test("GymPro charge calculation preserves fractional currency", () => {
  assert.equal(calculateGymProCharge(3, 12.35), 37.05);
});
