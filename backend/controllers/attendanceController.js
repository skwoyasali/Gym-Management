import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import Gym from "../models/Gym.js";
import {
  DEFAULT_GYM_TIMEZONE,
  getDateKeyInTimeZone,
  getUtcDayBounds,
} from "../utils/gymDate.js";

const getCalendarDayDifference = (fromDateKey, toDateKey) => {
  const from = getUtcDayBounds(fromDateKey);
  const to = getUtcDayBounds(toDateKey);
  if (!from || !to) return 0;
  return Math.round((to.start.getTime() - from.start.getTime()) / 86400000);
};

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
    const timeZone = gym?.timezone || DEFAULT_GYM_TIMEZONE;
    const today = getDateKeyInTimeZone(new Date(), timeZone);

    const [attendance, member] = await Promise.all([
      Attendance.find({
        tenantId: req.user.tenantId,
        memberId: req.user.memberId,
      })
        .sort({ attendanceDate: -1 })
        .limit(60)
        .lean(),
      Member.findOne({
        _id: req.user.memberId,
        createdBy: req.user.tenantId,
        userId: req.user.id,
      })
        .populate("plan", "name duration")
        .lean(),
    ]);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const startDate = member.membershipStart.toISOString().slice(0, 10);
    const endDate = member.membershipEnd.toISOString().slice(0, 10);
    const daysUntilStart = getCalendarDayDifference(today, startDate);
    const daysRemaining =
      !member.active || endDate < today
        ? 0
        : getCalendarDayDifference(today > startDate ? today : startDate, endDate) +
          1;
    const membershipStatus = !member.active
      ? "inactive"
      : today < startDate
        ? "upcoming"
        : today > endDate
          ? "expired"
          : "active";

    return res.status(200).json({
      success: true,
      data: attendance,
      today,
      membership: {
        planName: member.plan?.name || "Membership",
        startDate,
        endDate,
        daysRemaining,
        daysUntilStart: Math.max(0, daysUntilStart),
        status: membershipStatus,
      },
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
