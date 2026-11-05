import "dotenv/config";
import mongoose from "mongoose";
import Member from "../models/Member.js";

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to migrate member phone indexes");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const indexes = await Member.collection.indexes();
  for (const index of indexes) {
    const keys = Object.entries(index.key || {});
    const isGlobalPhoneIndex =
      index.unique &&
      keys.length === 1 &&
      keys[0][0] === "phone" &&
      keys[0][1] === 1;

    if (isGlobalPhoneIndex) {
      await Member.collection.dropIndex(index.name);
      console.log(`Dropped global member phone index: ${index.name}`);
    }
  }

  await Member.collection.createIndex(
    { createdBy: 1, phone: 1 },
    { unique: true }
  );
  console.log("Created tenant-scoped member phone index");
};

migrate()
  .catch((error) => {
    console.error("Member phone index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
