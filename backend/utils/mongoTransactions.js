export const supportsMongoTransactions = (helloResponse) =>
  Boolean(helloResponse?.setName || helloResponse?.msg === "isdbgrid");

export const mongoTransactionsUnavailableMessage =
  "MongoDB transactions are unavailable. Configure MongoDB as a replica set (a single-node replica set is sufficient) before processing member recharges.";
