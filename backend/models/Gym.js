import mongoose from "mongoose";

const upiPaymentSchema = new mongoose.Schema(
  {
    upiId: { type: String, trim: true, maxlength: 120 },
    receiverName: { type: String, trim: true, maxlength: 120 },
    paymentNumber: { type: String, trim: true, maxlength: 30 },
    qrStorageKey: { type: String, select: false },
    instructions: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const gymSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gymName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },
    upiPayment: {
      type: upiPaymentSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Gym", gymSchema);