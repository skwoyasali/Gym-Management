import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import process from "node:process";
import User from "../models/User.js";
import { promptForInput } from "../utils/terminalPrompt.js";

dotenv.config();

try {
  const email = (
    process.env.SUPER_ADMIN_EMAIL ||
    (await promptForInput("Super Admin email: "))
  )
    .trim()
    .toLowerCase();
  const password =
    process.env.SUPER_ADMIN_PASSWORD ||
    (await promptForInput("Super Admin password (input hidden): ", {
      masked: true,
    }));
  const confirmation =
    process.env.SUPER_ADMIN_PASSWORD ||
    (await promptForInput("Confirm password (input hidden): ", {
      masked: true,
    }));
  const username =
    process.env.SUPER_ADMIN_NAME?.trim() ||
    (await promptForInput("Super Admin display name [GymPro Super Admin]: "))
      .trim() ||
    "GymPro Super Admin";

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    password.length > 128 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    password !== confirmation ||
    username.length < 2 ||
    username.length > 100
  ) {
    throw new Error(
      "Use a valid email, matching passwords of 12–128 characters with uppercase, lowercase, and a number, and a name between 2 and 100 characters."
    );
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email }).select("_id role").lean();
  if (existing) {
    throw new Error(
      existing.role === "super_admin"
        ? "A Super Admin account already exists for this email"
        : "This email already belongs to another account; refusing to change its role"
    );
  }
  await User.create({
    email,
    username,
    password: await bcrypt.hash(password, 10),
    role: "super_admin",
    isProfileCompleted: true,
  });
  console.log(`Super Admin account created for ${email}`);
} catch (error) {
  console.error("Unable to create Super Admin account:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
