import mongoose from "mongoose";

const rechargeRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1, max: 120 },
    amount: { type: Number, required: true, min: 0 },
    proofStorageKey: { type: String, required: true },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    membershipRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipRecord",
    },
  },
  { timestamps: true }
);

rechargeRequestSchema.index({ tenantId:  1, status: 1, createdAt: -1 });
rechargeRequestSchema.index({ tenantId: 1, memberId: 1, createdAt: -1 });
rechargeRequestSchema.index(
  { memberId: 1, planId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

export default mongoose.model("RechargeRequest", rechargeRequestSchema);
