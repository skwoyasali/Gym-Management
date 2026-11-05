import User from "../models/User.js";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password);

const createToken = ({ userId, tenantId, role, memberId }) =>
  jwt.sign(
    {
      id: userId,
      tenantId,
      role,
      ...(memberId ? { memberId } : {}),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

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

    if (!isStrongPassword(password)) {
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

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hash,
      role: "admin",
    });
    user.tenantId = user._id;
    await user.save();

    const tenantId = user._id.toString();
    const token = createToken({
      userId: tenantId,
      tenantId,
      role: "admin",
    });

    res.status(201).json({
      message: "Registered successfully",
      token,
      userData: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: "admin",
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
    const { email, password, accountType } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (
      accountType !== undefined &&
      !["admin", "member"].includes(accountType)
    ) {
      return res.status(400).json({
        message: "Invalid account type",
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

    let updatedLegacyAccount = false;
    if (user.role === "owner") {
      user.role = "admin";
      updatedLegacyAccount = true;
    }

    if (user.role === "admin" && !user.tenantId) {
      user.tenantId = user._id;
      updatedLegacyAccount = true;
    }

    if (updatedLegacyAccount) {
      await user.save();
    }

    const role = user.role;
    if (!["admin", "member"].includes(role)) {
      return res.status(403).json({
        message: "This account role is not supported",
      });
    }

    if (accountType && accountType !== role) {
      return res.status(403).json({
        message:
          role === "member"
            ? "This is a member account. Choose Member sign in."
            : "This is a gym owner account. Choose Gym Owner sign in.",
      });
    }

    const tenantId =
      role === "admin"
        ? (user.tenantId || user._id).toString()
        : user.tenantId?.toString();
    if (!tenantId || (role === "member" && !user.memberId)) {
      return res.status(403).json({
        message: "This account is not linked to an active gym membership",
      });
    }

    const gym = await Gym.findOne({ ownerId: tenantId })
      .select("gymName")
      .lean();

    const token = createToken({
      userId: user._id.toString(),
      tenantId,
      role,
      memberId: role === "member" ? user.memberId.toString() : null,
    });

    const userData = user.toObject();

    delete userData.password;
    userData.role = role;
    userData.tenantId = tenantId;
    userData.tenantName = gym?.gymName || null;
    userData.isProfileCompleted =
      role === "member" ? true : user.isProfileCompleted;

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

export const activateMember = async (req, res) => {
  try {
    const { email, activationCode, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof activationCode !== "string" ||
      !isStrongPassword(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter your email, a valid activation code, and a strong password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const activationCodeHash = crypto
      .createHash("sha256")
      .update(activationCode.trim())
      .digest("hex");
    const member = await Member.findOne({
      email: normalizedEmail,
      activationCodeHash,
      activationCodeExpiresAt: { $gt: new Date() },
      userId: { $exists: false },
    })
      .select("+activationCodeHash +activationCodeExpiresAt")
      .lean();

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "Activation code is invalid, expired, or already used",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = new User({
      username: member.name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: "member",
      tenantId: member.createdBy,
      memberId: member._id,
      isProfileCompleted: true,
    });

    await user.save();

    const linkedMember = await Member.findOneAndUpdate(
      {
        _id: member._id,
        activationCodeHash,
        activationCodeExpiresAt: { $gt: new Date() },
        userId: { $exists: false },
      },
      {
        $set: { userId: user._id },
        $unset: {
          activationCodeHash: "",
          activationCodeExpiresAt: "",
        },
      },
      { new: true }
    );

    if (!linkedMember) {
      await User.deleteOne({ _id: user._id });
      return res.status(409).json({
        success: false,
        message: "This activation code has already been used",
      });
    }

    const tenantId = member.createdBy.toString();
    const gym = await Gym.findOne({ ownerId: tenantId })
      .select("gymName")
      .lean();
    const token = createToken({
      userId: user._id.toString(),
      tenantId,
      role: "member",
      memberId: member._id.toString(),
    });

    return res.status(201).json({
      success: true,
      token,
      userData: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: "member",
        isProfileCompleted: true,
        tenantId,
        tenantName: gym?.gymName || null,
        memberId: member._id,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Member activation error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to activate this member account right now",
    });
  }
};