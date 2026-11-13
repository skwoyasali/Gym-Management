import mongoose from "mongoose";

const gymBillingSchema = new mongoose.Schema(
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
    },
    membershipRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipRecord",
      required: true,
      unique: true,
    },
    planName: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1, max: 120 },
    purchasedAt: { type: Date, required: true },
    pricePerMemberMonth: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      required: true,
      index: true,
    },
    paidAt: Date,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymProPayment",
    },
  },
  { timestamps: true }
);

gymBillingSchema.index({ tenantId: 1, purchasedAt: -1 });
gymBillingSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model("GymBilling", gymBillingSchema);
