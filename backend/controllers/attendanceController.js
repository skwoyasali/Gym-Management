import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import Gym from "../models/Gym.js";
import {
  DEFAULT_GYM_TIMEZONE,
  getDateKeyInTimeZone,
  getUtcDayBounds,
} from "../utils/gymDate.js";

export const getTenantAttendance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.id;
    const gym = await Gym.findOne({ ownerId: tenantId })
      .select("timezone")
      .lean();
    const timeZone = gym?.timezone || DEFAULT_GYM_TIMEZONE;
    const dateKey =
      typeof req.query.date === "string"
        ? req.query.date
        : getDateKeyInTimeZone(new Date(), timeZone);
    const bounds = getUtcDayBounds(dateKey);

    if (!bounds) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    const attendance = await Attendance.find({
      tenantId,
      attendanceDate: { $gte: bounds.start, $lt: bounds.end },
    })
      .populate("memberId", "name phone email")
      .sort({ checkedInAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance,
      date: dateKey,
    });
  } catch (error) {
    console.error("Get tenant attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

export const getMemberAttendance = async (req, res) => {
  try {
    const gym = await Gym.findOne({ ownerId: req.user.tenantId })
      .select("timezone")
      .lean();
    const today = getDateKeyInTimeZone(
      new Date(),
      gym?.timezone || DEFAULT_GYM_TIMEZONE
    );

    const attendance = await Attendance.find({
      tenantId: req.user.tenantId,
      memberId: req.user.memberId,
    })
      .sort({ attendanceDate: -1 })
      .limit(60)
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance,
      today,
    });
  } catch (error) {
    console.error("Get member attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your attendance",
    });
  }
};

export const checkInMember = async (req, res) => {
  try {
    const { tenantId, memberId } = req.user;

    if (
      !mongoose.isValidObjectId(tenantId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Member account is not linked correctly",
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

    const member = await Member.findOne({
      _id: memberId,
      createdBy: tenantId,
      userId: req.user.id,
      active: true,
      membershipStart: { $lt: tomorrow },
      membershipEnd: { $gte: today },
    }).lean();

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to check in",
      });
    }

    try {
      const attendance = await Attendance.create({
        tenantId,
        memberId,
        attendanceDate: today,
        checkedInAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Attendance recorded",
        data: attendance,
        today: todayKey,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;

      const attendance = await Attendance.findOne({
        tenantId,
        memberId,
        attendanceDate: { $gte: today, $lt: tomorrow },
      }).lean();

      return res.status(409).json({
        success: false,
        message: "You have already checked in today",
        data: attendance,
        today: todayKey,
      });
    }
  } catch (error) {
    console.error("Member attendance check-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record attendance",
    });
  }
};
