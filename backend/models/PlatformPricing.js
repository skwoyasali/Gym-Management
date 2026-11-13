import mongoose from "mongoose";

const platformPricingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },
    pricePerMemberMonth: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
      default: 50,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, _id: false }
);

export default mongoose.model("PlatformPricing", platformPricingSchema);
