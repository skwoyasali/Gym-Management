import test from "node:test";
import assert from "node:assert/strict";
import requireRole from "../middleware/requireRole.js";

test("recharge role guard allows only explicitly configured roles", () => {
  const middleware = requireRole("admin");
  let nextCalled = false;
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  middleware({ user: { role: "admin" } }, response, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  const forbiddenResponse = { ...response, statusCode: 200, body: null };
  nextCalled = false;
  middleware(
    { user: { role: "member" } },
    forbiddenResponse,
    () => {
      nextCalled = true;
    }
  );
  assert.equal(forbiddenResponse.statusCode, 403);
  assert.equal(forbiddenResponse.body.success, false);
  assert.equal(nextCalled, false);
});

test("member data scopes come only from the authenticated identity", async () => {
  const {
    getOwnMemberFilter,
    getRechargeRequestFilter,
    getTenantRechargeRequestFilter,
  } = await import("../utils/rechargeAccess.js");
  const memberUser = {
    id: "member-user-1",
    memberId: "member-1",
    tenantId: "gym-1",
    role: "member",
  };
  assert.deepEqual(getOwnMemberFilter(memberUser), {
    _id: "member-1",
    createdBy: "gym-1",
    userId: "member-user-1",
  });
  assert.deepEqual(getRechargeRequestFilter(memberUser, "request-1"), {
    _id: "request-1",
    tenantId: "gym-1",
    memberId: "member-1",
  });
  assert.deepEqual(
    getTenantRechargeRequestFilter({
      id: "admin-1",
      tenantId: "gym-2",
      role: "admin",
    }),
    { tenantId: "gym-2" }
  );
});
