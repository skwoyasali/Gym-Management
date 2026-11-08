import test from "node:test";
import assert from "node:assert/strict";
import {
  mongoTransactionsUnavailableMessage,
  supportsMongoTransactions,
} from "../utils/mongoTransactions.js";

test("replica sets and mongos support transactional recharge", () => {
  assert.equal(supportsMongoTransactions({ setName: "rs0" }), true);
  assert.equal(supportsMongoTransactions({ msg: "isdbgrid" }), true);
});

test("standalone MongoDB is rejected with a configuration message", () => {
  assert.equal(supportsMongoTransactions({}), false);
  assert.match(mongoTransactionsUnavailableMessage, /single-node replica set/);
});
