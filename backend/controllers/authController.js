import User from "../models/User.js";
import Gym from "../models/Gym.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedUsername.length < 2 || normalizedUsername.length > 100) {
      return res.status(400).json({
        message: "Name must be between 2 and 100 characters",
      });
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (
      password.length < 8 ||
      password.length > 128 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be 8–128 characters and include uppercase, lowercase, and a number",
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hash,
    });

    const tenantId = user._id.toString();
    const token = jwt.sign(
      {
        id: tenantId,
        tenantId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registered successfully",
      token,
      userData: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        tenantId,
        tenantName: null,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      message: "Unable to create your account right now",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const tenantId = user._id.toString();
    const gym = await Gym.findOne({ ownerId: user._id })
      .select("gymName")
      .lean();

    const token = jwt.sign(
      {
        id: tenantId,
        tenantId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
       // Convert Mongoose document to plain object
    const userData = user.toObject();

    // Remove password
    delete userData.password;
    userData.tenantId = tenantId;
    userData.tenantName = gym?.gymName || null;

    res.status(200).json({
      token,
      userData,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Unable to sign in right now",
    });
  }
};