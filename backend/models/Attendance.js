import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
    attendanceDate: {
      type: Date,
      required: true,
    },
    checkedInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { tenantId: 1, memberId: 1, attendanceDate: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
