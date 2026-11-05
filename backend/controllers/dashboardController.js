import mongoose from "mongoose";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Gym from "../models/Gym.js";
import {
  DEFAULT_GYM_TIMEZONE,
  getDateKeyInTimeZone,
  getUtcDayBounds,
} from "../utils/gymDate.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.id;

    if (!mongoose.isValidObjectId(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const gym = await Gym.findOne({ ownerId: tenantId })
      .select("timezone")
      .lean();
    const todayKey = getDateKeyInTimeZone(
      new Date(),
      gym?.timezone || DEFAULT_GYM_TIMEZONE
    );
    const { start: today, end: tomorrow } = getUtcDayBounds(todayKey);
    const [summary] = await Member.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(tenantId),
        },
      },
      {
        $lookup: {
          from: Plan.collection.name,
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      {
        $unwind: {
          path: "$planDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          activeMemberships: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$active", true] },
                    { $lt: ["$membershipStart", tomorrow] },
                    { $gte: ["$membershipEnd", today] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          membershipValue: {
            $sum: { $ifNull: ["$planDetails.price", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalMembers: 1,
          activeMemberships: 1,
          membershipValue: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: summary || {
        totalMembers: 0,
        activeMemberships: 0,
        membershipValue: 0,
      },
      revenueDefinition:
        "Sum of plan prices assigned to this tenant's members; payments are not tracked.",
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
};
