import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { promptForInput } from "../utils/terminalPrompt.js";

dotenv.config();

try {
  const email = (await promptForInput("Super Admin email: "))
    .trim()
    .toLowerCase();
  const password = await promptForInput(
    "New password (input hidden): ",
    { masked: true }
  );
  const confirmation = await promptForInput(
    "Confirm new password (input hidden): ",
    { masked: true }
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address");
  }
  if (
    password.length < 12 ||
    password.length > 128 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    password !== confirmation
  ) {
    throw new Error(
      "Passwords must match and be 12–128 characters with uppercase, lowercase, and a number"
    );
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email, role: "super_admin" });
  if (!user) {
    throw new Error(
      "No Super Admin account exists for that email in the configured database"
    );
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();
  console.log("Super Admin password reset successfully.");
} catch (error) {
  console.error("Unable to reset Super Admin password:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
