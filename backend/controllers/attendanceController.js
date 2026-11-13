import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import MembershipRecord from "../models/MembershipRecord.js";
import Gym from "../models/Gym.js";
import {
  DEFAULT_GYM_TIMEZONE,
  getDateKeyInTimeZone,
  getUtcDayBounds,
} from "../utils/gymDate.js";
import {
  dateKeyToUtcDate,
  selectLatestMembershipRecord,
} from "../utils/membershipDates.js";
import { serializeMemberPhoto } from "../utils/memberPhoto.js";

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
      .populate("memberId", "name phone email +photoStorageKey")
      .sort({ checkedInAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: attendance.map((record) => ({
        ...record,
        memberId: serializeMemberPhoto(record.memberId),
      })),
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

    const todayDate = dateKeyToUtcDate(today);
    const [
      attendance,
      member,
      validMemberships,
      nextUpcomingMembership,
      hasMembershipHistory,
    ] =
      await Promise.all([
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
        MembershipRecord.find({
          tenantId: req.user.tenantId,
          memberId: req.user.memberId,
          approvalStatus: "approved",
          membershipStart: { $lte: todayDate },
          membershipEnd: { $gte: todayDate },
        })
          .sort({ membershipEnd: -1, membershipStart: -1, createdAt: -1 })
          .lean(),
        MembershipRecord.findOne({
          tenantId: req.user.tenantId,
          memberId: req.user.memberId,
          approvalStatus: "approved",
          membershipStart: { $gt: todayDate },
          membershipEnd: { $gte: todayDate },
        })
          .sort({ membershipStart: 1, membershipEnd: 1, createdAt: 1 })
          .lean(),
        MembershipRecord.exists({
          tenantId: req.user.tenantId,
          memberId: req.user.memberId,
          approvalStatus: "approved",
        }),
      ]);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const latestCurrentRecord = selectLatestMembershipRecord(validMemberships, {
      today,
    });
    const latestHistoryRecord = hasMembershipHistory
      ? await MembershipRecord.findOne({
          tenantId: req.user.tenantId,
          memberId: req.user.memberId,
          approvalStatus: "approved",
        })
          .sort({ membershipEnd: -1, membershipStart: -1, createdAt: -1 })
          .lean()
      : null;
    const displayedMembership =
      latestCurrentRecord ||
      selectLatestMembershipRecord(
        latestHistoryRecord ? [latestHistoryRecord] : []
      ) ||
      (!hasMembershipHistory &&
      member.membershipStart instanceof Date &&
      member.membershipEnd instanceof Date
        ? member
        : null);
    const startDate = displayedMembership?.membershipStart
      ? displayedMembership.membershipStart.toISOString().slice(0, 10)
      : null;
    const endDate = displayedMembership?.membershipEnd
      ? displayedMembership.membershipEnd.toISOString().slice(0, 10)
      : null;
    const daysUntilStart = getCalendarDayDifference(today, startDate);
    const daysRemaining =
      !member.active || !endDate || endDate < today
        ? 0
        : getCalendarDayDifference(today > startDate ? today : startDate, endDate) +
          1;
    const membershipStatus = !member.active || !displayedMembership
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
        planName:
          (displayedMembership === member
            ? member.plan?.name
            : displayedMembership?.planName) || "Membership",
        startDate,
        endDate,
        daysRemaining,
        daysUntilStart: Math.max(0, daysUntilStart),
        status: membershipStatus,
      },
      upcomingMembership: nextUpcomingMembership
        ? {
            planName: nextUpcomingMembership.planName,
            durationMonths: nextUpcomingMembership.durationMonths,
            startDate: nextUpcomingMembership.membershipStart
              .toISOString()
              .slice(0, 10),
            endDate: nextUpcomingMembership.membershipEnd
              .toISOString()
              .slice(0, 10),
            daysUntilStart: Math.max(
              0,
              getCalendarDayDifference(
                today,
                nextUpcomingMembership.membershipStart.toISOString().slice(0, 10)
              )
            ),
          }
        : null,
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

    const [member, validMemberships, hasMembershipHistory] = await Promise.all([
      Member.findOne({
        _id: memberId,
        createdBy: tenantId,
        userId: req.user.id,
      }).lean(),
      MembershipRecord.find({
        tenantId,
        memberId,
        approvalStatus: "approved",
        membershipStart: { $lt: tomorrow },
        membershipEnd: { $gte: today },
      })
        .sort({ membershipEnd: -1, membershipStart: -1, createdAt: -1 })
        .lean(),
      MembershipRecord.exists({
        tenantId,
        memberId,
        approvalStatus: "approved",
      }),
    ]);

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to check in",
      });
    }

    const latestCurrentRecord = selectLatestMembershipRecord(validMemberships, {
      today: todayKey,
    });
    const hasCurrentMembership = hasMembershipHistory
      ? Boolean(latestCurrentRecord)
      : member.membershipStart < tomorrow && member.membershipEnd >= today;

    if (!member.active || !hasCurrentMembership) {
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
