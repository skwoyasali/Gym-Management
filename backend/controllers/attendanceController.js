import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";

const getUtcDay = (date) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
};

export const getTenantAttendance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.id;
    const selectedDay = req.query.date ? new Date(req.query.date) : new Date();

    if (Number.isNaN(selectedDay.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date",
      });
    }

    const start = getUtcDay(selectedDay);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const attendance = await Attendance.find({
      tenantId,
      attendanceDate: { $gte: start, $lt: end },
    })
      .populate("memberId", "name phone email")
      .sort({ checkedInAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance,
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

    const today = getUtcDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const member = await Member.findOne({
      _id: memberId,
      createdBy: tenantId,
      userId: req.user.id,
      active: true,
      membershipStart: { $lte: new Date() },
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
