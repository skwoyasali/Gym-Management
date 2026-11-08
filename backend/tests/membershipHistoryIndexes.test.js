import test from "node:test";
import assert from "node:assert/strict";
import MembershipRecord from "../models/MembershipRecord.js";
import Member from "../models/Member.js";
import RechargeRequest from "../models/RechargeRequest.js";

test("membership history prevents a request from creating two records", () => {
  const rechargeIndex = MembershipRecord.schema
    .indexes()
    .find(([keys]) => keys.rechargeRequestId === 1);

  assert.ok(rechargeIndex);
  assert.equal(rechargeIndex[1].unique, true);
  assert.equal(rechargeIndex[1].sparse, true);
});

test("members can be created without assigning a membership", () => {
  assert.notEqual(Member.schema.path("plan").isRequired, true);
  assert.notEqual(Member.schema.path("membershipStart").isRequired, true);
  assert.notEqual(Member.schema.path("membershipEnd").isRequired, true);
});

test("history supports manual admin recharge payment methods", () => {
  const paymentMethodPath = MembershipRecord.schema.path("paymentMethod");
  assert.deepEqual(paymentMethodPath.enumValues, [
    "cash",
    "upi",
    "card",
    "bank_transfer",
    "other",
  ]);
  assert.ok(
    MembershipRecord.schema.path("source").enumValues.includes("admin_recharge")
  );
});

test("only one pending request per member and plan can exist", () => {
  const pendingRequestIndex = RechargeRequest.schema
    .indexes()
    .find(
      ([keys]) =>
        keys.memberId === 1 &&
        keys.planId === 1 &&
        keys.status === 1
    );

  assert.ok(pendingRequestIndex);
  assert.equal(pendingRequestIndex[1].unique, true);
  assert.deepEqual(pendingRequestIndex[1].partialFilterExpression, {
    status: "pending",
  });
});
