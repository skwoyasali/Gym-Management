import "dotenv/config";
import mongoose from "mongoose";
import Plan from "../models/Plan.js";

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to migrate membership plan indexes");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const indexes = await Plan.collection.indexes();
  for (const index of indexes) {
    const keys = Object.entries(index.key || {});
    const isGlobalNameIndex =
      index.unique &&
      keys.length === 1 &&
      keys[0][0] === "name" &&
      keys[0][1] === 1;

    if (isGlobalNameIndex) {
      await Plan.collection.dropIndex(index.name);
      console.log(`Dropped global plan name index: ${index.name}`);
    }
  }

  await Plan.collection.createIndex(
    { createdBy: 1, name: 1 },
    { unique: true }
  );
  console.log("Created gym-scoped plan name index");
};

migrate()
  .catch((error) => {
    console.error("Membership plan index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
