import mongoose from "mongoose";

const membershipRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1, max: 120 },
    amount: { type: Number, required: true, min: 0 },
    membershipStart: { type: Date, required: true },
    membershipEnd: { type: Date, required: true },
    rechargedAt: { type: Date, required: true },
    paymentStatus: {
      type: String,
      enum: ["verified", "not_recorded"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "other"],
    },
    approvalStatus: {
      type: String,
      enum: ["approved"],
      default: "approved",
      required: true,
    },
    source: {
      type: String,
      enum: ["recharge", "admin_recharge", "legacy"],
      required: true,
    },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    rechargeRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RechargeRequest",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

membershipRecordSchema.index({ tenantId: 1, memberId: 1, membershipStart: -1 });
membershipRecordSchema.index(
  { rechargeRequestId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("MembershipRecord", membershipRecordSchema);
