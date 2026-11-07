import "dotenv/config";
import mongoose from "mongoose";
import MembershipRecord from "../models/MembershipRecord.js";
import RechargeRequest from "../models/RechargeRequest.js";

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to create recharge indexes");
  }

  await mongoose.connect(process.env.MONGO_URI);
  await MembershipRecord.createIndexes();
  await RechargeRequest.createIndexes();
  console.log("Created membership history and recharge request indexes");
};

migrate()
  .catch((error) => {
    console.error("Recharge index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
