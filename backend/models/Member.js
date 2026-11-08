// models/Member.js

import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    dateOfBirth: {
      type: Date,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },

    membershipStart: {
      type: Date,
    },

    membershipEnd: {
      type: Date,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
    activationCodeHash: {
      type: String,
      select: false,
    },
    activationCodeExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ createdBy: 1, phone: 1 }, { unique: true });

memberSchema.index(
  { activationCodeHash: 1 },
  { unique: true, sparse: true }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;  