import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "member", "super_admin"],
      default: "admin",
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      unique: true,
      sparse: true,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
