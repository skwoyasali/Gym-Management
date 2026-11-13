import mongoose from "mongoose";

const gymProPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    billingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymBilling",
      required: true,
      unique: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true },
    reference: { type: String, trim: true, maxlength: 120 },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

gymProPaymentSchema.index({ tenantId: 1, paymentDate: -1 });

export default mongoose.model("GymProPayment", gymProPaymentSchema);
